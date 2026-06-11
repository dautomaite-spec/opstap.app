import re
from fastapi import APIRouter, Depends, HTTPException, Request
from uuid import uuid4
from datetime import datetime, timezone, timedelta

_EMAIL_RE = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')

from app.core.supabase import get_supabase
from app.core.auth import get_current_user_id
from app.core.rate_limiter import (
    check_and_increment_letter,
    get_letter_usage,
    APPLY_DAILY_LIMIT,
    check_ip_flood,
)

APPLY_PER_COMPANY_WEEKLY_LIMIT = 1  # max 1 application per company per user per 7 days
from app.schemas.application import (
    MotivationLetterRequest,
    MotivationLetterOut,
    ApplicationCreate,
    ApplicationOut,
    ApplicationStatusUpdate,
)
from app.services.letter_generator import generate_letter
from app.services.email_sender import send_application_email, ApplicationEmail
from app.services.prompt_guard import (
    PromptInjectionError,
    sanitize_and_check_profile_text,
)
from app.services.credits import maybe_award_referrer_credit
from app.services.email_notifications import send_credit_low_warning, send_reply_congratulations

router = APIRouter(prefix="/apply", tags=["apply"])


@router.post("/letter", response_model=MotivationLetterOut)
async def generate_motivation_letter(
    body: MotivationLetterRequest,
    user_id: str = Depends(get_current_user_id),
    supabase=Depends(get_supabase),
):
    # ── Rate limiting ──────────────────────────────────────────────────────────
    allowed, reason = check_and_increment_letter(user_id, str(body.job_id))
    if not allowed:
        raise HTTPException(status_code=429, detail=reason)

    # Fetch and validate job + profile before debiting — prevents losing a credit on a 404
    job_result = supabase.table("jobs").select("*").eq("id", str(body.job_id)).single().execute()
    if not job_result.data:
        raise HTTPException(status_code=404, detail="Job not found")
    job = job_result.data

    profile_result = (
        supabase.table("profiles")
        .select("*")
        .eq("id", str(body.profile_id))
        .eq("user_id", user_id)          # ownership check — prevents cross-user data access
        .single()
        .execute()
    )
    if not profile_result.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    profile = profile_result.data

    # ── Credit check (atomic debit — 402 if insufficient) ─────────────────────
    debit_result = supabase.rpc("debit_one_credit", {
        "p_user_id": user_id,
        "p_reference": str(body.job_id),
    }).execute()
    if debit_result.data is False:
        raise HTTPException(
            status_code=402,
            detail="Onvoldoende credits. Koop credits om verder te gaan.",
        )

    # Send credit-low warning when balance drops to 1 — fire-and-forget, deduped per month
    try:
        bal_result = supabase.table("profiles").select("credits_balance").eq("user_id", user_id).single().execute()
        if bal_result.data and bal_result.data.get("credits_balance") == 1:
            from datetime import date
            month_key = date.today().strftime("%Y-%m")
            insert_result = supabase.table("notifications").insert({
                "user_id": user_id,
                "type": "credit_low",
                "reference_id": month_key,
            }).execute()
            if insert_result.data:
                auth_user = supabase.auth.admin.get_user_by_id(user_id)
                user_email = auth_user.user.email if auth_user.user else None
                if user_email:
                    send_credit_low_warning(user_email, profile.get("naam", ""), 1)
    except Exception:
        pass  # never block the letter on notification failure

    if body.custom_notes:
        # Injection-check custom_notes before merging into the profile that
        # flows into the Claude prompt.  URLs are not expected in personal notes.
        try:
            sanitize_and_check_profile_text(body.custom_notes, "custom_notes", 500)
        except PromptInjectionError:
            raise HTTPException(
                status_code=422,
                detail=(
                    "Ongeldige invoer in 'Persoonlijke notities'. "
                    "Verwijder eventuele instructies, links of HTML en probeer opnieuw."
                ),
            )
        profile = {**profile, "extra_info": f"{profile.get('extra_info', '')}\n{body.custom_notes}".strip()}

    try:
        letter = await generate_letter(
            job_title=job["title"],
            company=job["company"],
            job_description=job.get("description_snippet") or "",
            profile=profile,
            writing_style=body.writing_style or "formeel",
        )
    except PromptInjectionError:
        raise HTTPException(
            status_code=422,
            detail=(
                "De ingevoerde gegevens bevatten inhoud die niet verwerkt kan worden. "
                "Controleer de vacature- en profielgegevens en probeer opnieuw."
            ),
        )

    # Award referrer credit on the referee's first ever letter (fire-and-forget)
    try:
        await maybe_award_referrer_credit(user_id, supabase)
    except Exception:
        pass

    quota = get_letter_usage(user_id, str(body.job_id))
    return MotivationLetterOut(
        job_id=body.job_id,
        letter_nl=letter,
        generated_at=datetime.now(timezone.utc),
        regenerations_remaining=quota["job_remaining"],
    )


@router.post("/send", response_model=ApplicationOut, status_code=201)
async def send_application(
    request: Request,
    body: ApplicationCreate,
    user_id: str = Depends(get_current_user_id),
    supabase=Depends(get_supabase),
):
    # ── IP flood protection ────────────────────────────────────────────────────
    ip = request.client.host if request.client else "unknown"
    if check_ip_flood(ip):
        raise HTTPException(status_code=429, detail="Te veel verzoeken. Probeer het later opnieuw.")
    # ── Rate limiting: max APPLY_DAILY_LIMIT applications per day ─────────────
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    usage_result = (
        supabase.table("applications")
        .select("id", count="exact")
        .eq("user_id", user_id)
        .gte("created_at", today_start.isoformat())
        .execute()
    )
    daily_count = usage_result.count or 0
    if daily_count >= APPLY_DAILY_LIMIT:
        raise HTTPException(
            status_code=429,
            detail=f"Je hebt het dagelijks limiet van {APPLY_DAILY_LIMIT} sollicitaties bereikt. Probeer morgen opnieuw.",
        )

    job_result = supabase.table("jobs").select("title,company,url,contact_email").eq("id", str(body.job_id)).single().execute()
    if not job_result.data:
        raise HTTPException(status_code=404, detail="Job not found")
    job = job_result.data

    profile_result = supabase.table("profiles").select("naam,is_suspended").eq("user_id", user_id).single().execute()
    if not profile_result.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    profile = profile_result.data

    # Check suspension before making any further API calls
    if profile.get("is_suspended"):
        raise HTTPException(
            status_code=403,
            detail="Je account is geschorst wegens vermoeden van misbruik. Neem contact op via misbruik@opstap.nl.",
        )

    # Get user email from Supabase auth (not stored on profile to avoid duplication)
    auth_user = supabase.auth.admin.get_user_by_id(user_id)
    profile["email"] = auth_user.user.email if auth_user.user else ""

    # ── Per-company weekly limit ───────────────────────────────────────────────
    week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    company_count_result = (
        supabase.table("applications")
        .select("id", count="exact")
        .eq("user_id", user_id)
        .eq("company", job["company"])
        .gte("created_at", week_ago)
        .execute()
    )
    if (company_count_result.count or 0) >= APPLY_PER_COMPANY_WEEKLY_LIMIT:
        raise HTTPException(
            status_code=429,
            detail=f"Je hebt deze week al gesolliciteerd bij {job['company']}. Wacht 7 dagen voor een nieuwe poging.",
        )

    now = datetime.now(timezone.utc)
    status = "pending"
    sent_at = None

    if body.send_method == "email":
        contact_email = job.get("contact_email")
        if not contact_email or not _EMAIL_RE.match(contact_email):
            raise HTTPException(
                status_code=422,
                detail="No valid contact email available for this job. Use send_method='form' instead.",
            )

        success = await send_application_email(ApplicationEmail(
            to_email=contact_email,
            to_name=job["company"],
            reply_to_email=profile.get("email", ""),
            reply_to_name=profile.get("naam", ""),
            job_title=job["title"],
            company=job["company"],
            letter_body=body.letter_nl,
        ))
        status = "sent" if success else "failed"
        sent_at = now.isoformat() if success else None

    row = {
        "id": str(uuid4()),
        "job_id": str(body.job_id),
        "user_id": user_id,
        "company": job["company"],
        "job_title": job["title"],
        "letter_nl": body.letter_nl,
        "send_method": body.send_method,
        "status": status,
        "sent_at": sent_at,
        "created_at": now.isoformat(),
    }
    result = supabase.table("applications").insert(row).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to log application")

    return result.data[0]


@router.get("/history", response_model=list[ApplicationOut])
async def application_history(
    user_id: str = Depends(get_current_user_id),
    supabase=Depends(get_supabase),
):
    result = (
        supabase.table("applications")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


@router.patch("/{application_id}/status", response_model=ApplicationOut)
async def update_application_status(
    application_id: str,
    body: ApplicationStatusUpdate,
    user_id: str = Depends(get_current_user_id),
    supabase=Depends(get_supabase),
):
    app_result = (
        supabase.table("applications")
        .select("*")
        .eq("id", application_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not app_result.data:
        raise HTTPException(status_code=404, detail="Sollicitatie niet gevonden")

    app = app_result.data
    now = datetime.now(timezone.utc)
    update = {"status": body.status}
    if body.status == "replied":
        update["replied_at"] = now.isoformat()

    updated = (
        supabase.table("applications")
        .update(update)
        .eq("id", application_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not updated.data:
        raise HTTPException(status_code=500, detail="Status bijwerken mislukt")

    # Congratulations email on first reply mark
    if body.status == "replied":
        try:
            auth_user = supabase.auth.admin.get_user_by_id(user_id)
            user_email = auth_user.user.email if auth_user.user else None
            profile_result = supabase.table("profiles").select("naam").eq("user_id", user_id).single().execute()
            naam = profile_result.data.get("naam", "") if profile_result.data else ""
            if user_email:
                send_reply_congratulations(user_email, naam, app["company"], app["job_title"])
        except Exception:
            pass

    return updated.data[0]
