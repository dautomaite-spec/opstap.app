from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File, Form
from fastapi.responses import Response
from typing import Annotated
from datetime import datetime, timedelta, timezone
from uuid import uuid4
import json
import re
import logging

from app.core.supabase import get_supabase
from app.core.auth import get_current_user_id
from app.schemas.profile import ProfileCreate, ProfileUpdate, ProfileOut
from app.services.credits import (
    award_signup_credits,
    award_referral_signup_credits,
    check_and_award_profile_bonus,
    generate_referral_code,
)
from app.services.cv_parser import parse_cv_async
from app.services.email_notifications import send_admin_signup_notification
from app.services.search_summary import regenerate_search_summary, check_rate_limit as _check_summary_rate_limit

router = APIRouter(prefix="/profile", tags=["profile"])
logger = logging.getLogger(__name__)

# Fields the search summary is actually built from — used to skip regeneration
# on unrelated profile updates (e.g. notification toggles).
_SUMMARY_RELEVANT_FIELDS = frozenset({
    "functietitel", "functietitel_2", "functietitel_3", "woonplaats", "werklocatie",
    "opleidingsniveau", "uren_per_week", "salaris_min", "salaris_max", "extra_info",
    "job_preferences", "job_background", "job_avoids", "job_company_size",
    "job_culture", "job_role_type",
})

CV_BUCKET = "cvs"
CV_SIGNED_URL_EXPIRY = 3600  # 1 hour


def _attach_cv_url(profile: dict, supabase) -> dict:
    """Replace cv_path with a signed cv_url if a CV is stored. Adds cv_parsed boolean."""
    path = profile.pop("cv_path", None)
    user_id = str(profile.get("user_id", ""))
    # Guard: only generate signed URL for paths owned by this user
    if path and path.startswith(f"{user_id}/"):
        try:
            res = supabase.storage.from_(CV_BUCKET).create_signed_url(path, CV_SIGNED_URL_EXPIRY)
            profile["cv_url"] = res.get("signedURL") or res.get("signed_url")
        except Exception:
            profile["cv_url"] = None
    else:
        profile["cv_url"] = None
    profile["cv_parsed"] = bool(profile.pop("cv_structured", None))
    return profile


@router.post("/", response_model=ProfileOut, status_code=201)
async def create_profile(
    body: ProfileCreate,
    user_id: str = Depends(get_current_user_id),
    supabase=Depends(get_supabase),
):
    data = body.model_dump()
    data["user_id"] = user_id
    data["referral_code"] = generate_referral_code()
    result = supabase.table("profiles").insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Profile creation failed")
    profile = result.data[0]

    # Award 5 signup credits
    try:
        await award_signup_credits(user_id, supabase)
    except Exception:
        pass

    # Award referral bonus if user signed up via a referral link
    try:
        auth_user = supabase.auth.admin.get_user_by_id(user_id)
        ref_code = (auth_user.user.user_metadata or {}).get("ref_code", "")
        if ref_code:
            await award_referral_signup_credits(user_id, ref_code, supabase)
    except Exception:
        pass

    # Notify admin of new signup — fire-and-forget
    import asyncio as _asyncio
    user_email = ""
    try:
        auth_user = supabase.auth.admin.get_user_by_id(user_id)
        user_email = auth_user.user.email or ""
    except Exception:
        pass
    _asyncio.create_task(send_admin_signup_notification(data.get("naam", ""), user_email))

    # Auto-generate the search summary right after profile creation — fire-and-forget
    _asyncio.create_task(regenerate_search_summary(user_id, supabase))

    return _attach_cv_url(profile, supabase)


@router.get("/me", response_model=ProfileOut)
async def get_profile(
    user_id: str = Depends(get_current_user_id),
    supabase=Depends(get_supabase),
):
    result = supabase.table("profiles").select("*").eq("user_id", user_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return _attach_cv_url(result.data, supabase)


@router.patch("/me", response_model=ProfileOut)
async def update_profile(
    body: ProfileUpdate,
    user_id: str = Depends(get_current_user_id),
    supabase=Depends(get_supabase),
):
    data = body.model_dump(exclude_unset=True)
    now_iso = datetime.now(timezone.utc).isoformat()
    data["updated_at"] = now_iso
    data["last_active_at"] = now_iso
    supabase.table("profiles").update(data).eq("user_id", user_id).execute()
    result = supabase.table("profiles").select("*").eq("user_id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    profile = result.data[0]

    # Award 1-credit profile-complete bonus if all fields are now filled
    try:
        await check_and_award_profile_bonus(user_id, profile, supabase)
    except Exception:
        pass

    # Regenerate the search summary only if a field it's actually built from changed —
    # avoids a Claude call on trivial toggles like email_digest_enabled
    if _SUMMARY_RELEVANT_FIELDS.intersection(data.keys()):
        import asyncio as _asyncio
        _asyncio.create_task(regenerate_search_summary(user_id, supabase))

    return _attach_cv_url(profile, supabase)


@router.delete("/me", status_code=200)
async def delete_account(
    user_id: str = Depends(get_current_user_id),
    supabase=Depends(get_supabase),
):
    # Delete CV from storage if present
    profile_result = supabase.table("profiles").select("cv_path").eq("user_id", user_id).maybe_single().execute()
    if profile_result.data and profile_result.data.get("cv_path"):
        try:
            supabase.storage.from_(CV_BUCKET).remove([profile_result.data["cv_path"]])
        except Exception:
            pass

    # Delete auth user first — if this fails, DB rows are still intact (safe to retry)
    supabase.auth.admin.delete_user(user_id)

    # Delete application rows, credit ledger, referral links, and profile
    # mollie_payments are NOT deleted — 7-year Dutch tax retention obligation
    supabase.table("applications").delete().eq("user_id", user_id).execute()
    supabase.table("credit_transactions").delete().eq("user_id", user_id).execute()
    supabase.table("referral_uses").delete().or_(
        f"referrer_user_id.eq.{user_id},referee_user_id.eq.{user_id}"
    ).execute()
    supabase.table("profiles").delete().eq("user_id", user_id).execute()

    return {"message": "Account deleted"}


_export_cooldown: dict[str, datetime] = {}

@router.get("/export")
async def export_my_data(
    request: Request,
    user_id: str = Depends(get_current_user_id),
    supabase=Depends(get_supabase),
):
    """AVG Art. 20 — return all personal data for this user as a downloadable JSON file."""
    # Per-user cooldown: max 1 export per 60 seconds
    now = datetime.now(timezone.utc)
    last = _export_cooldown.get(user_id)
    if last and (now - last).total_seconds() < 60:
        raise HTTPException(status_code=429, detail="Even wachten — je kunt maximaal 1 keer per minuut exporteren")
    _export_cooldown[user_id] = now

    profile_raw = supabase.table("profiles").select(
        "naam,email,woonplaats,functietitel,werklocatie,opleidingsniveau,uren_per_week,"
        "beschikbaarheid,brief_taal,leeftijd,extra_info,job_preferences,"
        "job_background,job_company_size,job_culture,job_role_type,job_avoids,job_search_summary,"
        "job_titles,salary_min,salary_max,"
        "referral_code,created_at,updated_at,cv_expires_at,avg_consent_given_at"
    ).eq("user_id", user_id).execute()

    applications_raw = supabase.table("applications").select(
        "id,job_title,company,job_location,job_salary,status,letter_nl,sent_at,created_at,replied_at,letter_rating"
    ).eq("user_id", user_id).order("created_at", desc=True).limit(500).execute()

    saved_raw = supabase.table("saved_jobs").select(
        "job_id,job_data,saved_at"
    ).eq("user_id", user_id).limit(500).execute()

    credits_raw = supabase.table("credit_transactions").select(
        "delta,reason,created_at"
    ).eq("user_id", user_id).order("created_at", desc=True).limit(500).execute()

    # referral_uses may not exist yet; skip gracefully
    try:
        referral_raw = supabase.table("referral_uses").select(
            "referrer_user_id,referee_user_id,created_at"
        ).or_(f"referrer_user_id.eq.{user_id},referee_user_id.eq.{user_id}").execute()
        referrals = referral_raw.data or []
    except Exception:
        referrals = []

    payload = {
        "exported_at": now.isoformat(),
        "user_id": user_id,
        "profile": profile_raw.data[0] if profile_raw.data else {},
        "applications": applications_raw.data or [],
        "saved_jobs": saved_raw.data or [],
        "credit_transactions": credits_raw.data or [],
        "referral_uses": referrals,
    }

    content = json.dumps(payload, ensure_ascii=False, indent=2, default=str)
    return Response(
        content=content,
        media_type="application/json",
        headers={"Content-Disposition": 'attachment; filename="opstap-mijn-gegevens.json"'},
    )


@router.post("/search-summary", status_code=200)
async def generate_search_summary(
    user_id: str = Depends(get_current_user_id),
    supabase=Depends(get_supabase),
):
    """Manually (re)generate the search profile summary using Claude Haiku."""
    now = datetime.now(timezone.utc)
    if not _check_summary_rate_limit(user_id, now):
        raise HTTPException(status_code=429, detail="Even wachten — je kunt maximaal 15 keer per uur een zoekprofiel genereren")

    summary = await regenerate_search_summary(user_id, supabase, bypass_rate_limit=True)
    if summary is None:
        raise HTTPException(status_code=502, detail="Samenvatting kon niet worden gegenereerd")
    return {"summary": summary}


@router.post("/search-summary/approve", status_code=200)
async def approve_search_summary(
    user_id: str = Depends(get_current_user_id),
    supabase=Depends(get_supabase),
):
    """Acknowledge the current AI-generated search summary. Not a gate — search
    works before approval too, this just records that the user has read it."""
    now_iso = datetime.now(timezone.utc).isoformat()
    result = supabase.table("profiles").update({
        "job_search_summary_approved_at": now_iso,
    }).eq("user_id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Profiel niet gevonden")
    return {"approved_at": now_iso}


@router.post("/cv", status_code=200)
async def upload_cv(
    retention_days: Annotated[int, Form(ge=7, le=90)] = 30,
    avg_consent: Annotated[bool, Form()] = False,
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
    supabase=Depends(get_supabase),
):
    allowed_mime = {
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }
    allowed_magic = (b"%PDF", b"PK\x03\x04")

    if not avg_consent:
        raise HTTPException(status_code=422, detail="AVG-toestemming is vereist voor het uploaden van een CV")

    if file.content_type not in allowed_mime:
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are accepted")

    content = await file.read()

    if not any(content.startswith(magic) for magic in allowed_magic):
        raise HTTPException(status_code=400, detail="File content does not match the declared type")

    max_bytes = 10 * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(status_code=400, detail="File too large (max 10 MB)")

    # Use a UUID-based filename to prevent path traversal and filename-based attacks
    ext = "pdf" if file.content_type == "application/pdf" else "docx"
    path = f"{user_id}/{uuid4()}.{ext}"
    supabase.storage.from_(CV_BUCKET).upload(path, content, {"content-type": file.content_type, "upsert": "true"})

    now = datetime.now(timezone.utc)
    expires_at = (now + timedelta(days=retention_days)).isoformat()
    supabase.table("profiles").update({
        "cv_path": path,
        "cv_expires_at": expires_at,
        "avg_consent_given_at": now.isoformat(),
        "last_active_at": now.isoformat(),
        "updated_at": now.isoformat(),
    }).eq("user_id", user_id).execute()

    # Fire-and-forget CV parsing — updates profiles.cv_structured asynchronously
    import asyncio as _asyncio
    _asyncio.create_task(parse_cv_async(content, file.content_type, user_id, supabase))

    return {"message": "CV uploaded", "expires_at": expires_at}


@router.post("/apply-cv", response_model=ProfileOut)
async def apply_cv_to_profile(
    user_id: str = Depends(get_current_user_id),
    supabase=Depends(get_supabase),
):
    """Map cv_structured fields into profile fields. Overwrites existing values."""
    result = supabase.table("profiles").select("*").eq("user_id", user_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Profiel niet gevonden")

    cv = result.data.get("cv_structured")
    if not cv:
        raise HTTPException(status_code=404, detail="Nog geen CV geanalyseerd. Upload eerst een CV en wacht een moment.")

    updates: dict = {}

    # Job titles from 2-3 most recent work experiences (deduplicated, most recent first)
    werkervaring = cv.get("werkervaring") or []
    seen_titles: set[str] = set()
    unique_titles: list[str] = []
    for w in werkervaring:
        t = w.get("functie", "").strip()[:120]
        if t and t.lower() not in seen_titles:
            seen_titles.add(t.lower())
            unique_titles.append(t)
        if len(unique_titles) == 3:
            break
    if len(unique_titles) > 0:
        updates["functietitel"] = unique_titles[0]
    if len(unique_titles) > 1:
        updates["functietitel_2"] = unique_titles[1]
    if len(unique_titles) > 2:
        updates["functietitel_3"] = unique_titles[2]

    # Summary -> extra_info
    samenvatting = (cv.get("samenvatting") or "").strip()
    if samenvatting:
        updates["extra_info"] = samenvatting[:500]

    # Education -> opleidingsniveau (map common Dutch/English degree names)
    opleiding = cv.get("opleiding") or []
    if opleiding:
        graad = ((opleiding[0].get("graad") or "") + " " + (opleiding[0].get("studierichting") or "")).lower()
        if any(k in graad for k in ("phd", "doctor", "promot")):
            updates["opleidingsniveau"] = "phd"
        elif any(k in graad for k in ("master", "msc", "m.sc", " ma ", "wo master")):
            updates["opleidingsniveau"] = "wo_master"
        elif any(k in graad for k in ("bachelor", "bsc", "b.sc", " ba ", "wo bachelor", " wo ")):
            updates["opleidingsniveau"] = "wo_bachelor"
        elif any(k in graad for k in ("hbo", "hogeschool", "propedeuse", "associate")):
            updates["opleidingsniveau"] = "hbo"
        elif "mbo" in graad:
            updates["opleidingsniveau"] = "mbo"
        elif any(k in graad for k in ("vmbo", "mavo", "basis")):
            updates["opleidingsniveau"] = "vmbo"

    if not updates:
        raise HTTPException(status_code=422, detail="CV bevat geen bruikbare profielgegevens.")

    now_iso = datetime.now(timezone.utc).isoformat()
    updates["updated_at"] = now_iso
    supabase.table("profiles").update(updates).eq("user_id", user_id).execute()
    refreshed = supabase.table("profiles").select("*").eq("user_id", user_id).single().execute()
    return _attach_cv_url(refreshed.data, supabase)


@router.delete("/cv", status_code=200)
async def delete_cv(
    user_id: str = Depends(get_current_user_id),
    supabase=Depends(get_supabase),
):
    result = supabase.table("profiles").select("cv_path").eq("user_id", user_id).single().execute()
    if not result.data or not result.data.get("cv_path"):
        raise HTTPException(status_code=404, detail="No CV on record")

    supabase.storage.from_(CV_BUCKET).remove([result.data["cv_path"]])
    supabase.table("profiles").update({
        "cv_path": None,
        "cv_expires_at": None,
        "cv_structured": None,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }).eq("user_id", user_id).execute()

    return {"message": "CV deleted"}
