"""
Admin endpoints — protected by X-Admin-Key header.

Cron endpoints (called by external scheduler):
  POST /api/v1/admin/cron/follow-up   — Sundays
  POST /api/v1/admin/cron/job-digest  — Mondays

n8n ingest endpoint (called by n8n vacancy-polling workflow):
  POST /api/v1/admin/ingest/jobs

User management endpoints (called by admin frontend):
  GET    /api/v1/admin/users
  POST   /api/v1/admin/users/{user_id}/credits
  DELETE /api/v1/admin/users/{user_id}
  PATCH  /api/v1/admin/users/{user_id}/suspend
"""

import asyncio
import logging
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel, Field, AnyHttpUrl
from typing import Optional, List

from app.core.config import settings
from app.core.supabase import get_supabase
from app.services.job_scraper import scrape_adzuna, scrape_indeed_nl
from app.services.email_notifications import send_follow_up_reminder, send_job_digest, send_credits_adjusted, send_account_suspended

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["admin"])

CV_BUCKET = "cvs"


def _check_admin_key(x_admin_key: Optional[str] = Header(None)):
    import hmac as _hmac
    if not _hmac.compare_digest(x_admin_key or "", settings.admin_api_key):
        raise HTTPException(status_code=403, detail="Forbidden")


# ── User management ────────────────────────────────────────────────────────────

class CreditAdjust(BaseModel):
    delta: int          # positive = grant, negative = debit
    reason: str         # shown in credit_transactions ledger


class SuspendUpdate(BaseModel):
    suspended: bool


@router.get("/users")
async def list_users(
    _: None = Depends(_check_admin_key),
    supabase=Depends(get_supabase),
):
    """Return all users with profile data, credit balance, and application count."""
    profiles_result = supabase.table("profiles").select(
        "user_id,naam,credits_balance,is_suspended,referral_code,created_at,last_active_at"
    ).order("created_at", desc=True).execute()
    profiles = profiles_result.data or []

    # Build user_id → email map from auth
    try:
        auth_users = supabase.auth.admin.list_users()
        email_map: dict[str, str] = {}
        users_list = auth_users if isinstance(auth_users, list) else getattr(auth_users, 'users', [])
        for u in users_list:
            uid = getattr(u, 'id', None) or (u.get('id') if isinstance(u, dict) else None)
            email = getattr(u, 'email', None) or (u.get('email') if isinstance(u, dict) else None)
            if uid and email:
                email_map[uid] = email
    except Exception:
        logger.warning("Could not fetch auth users for email map", exc_info=True)
        email_map = {}

    # Get application counts per user
    try:
        apps_result = supabase.table("applications").select("user_id").execute()
        app_count_map: dict[str, int] = {}
        for row in (apps_result.data or []):
            uid = row["user_id"]
            app_count_map[uid] = app_count_map.get(uid, 0) + 1
    except Exception:
        app_count_map = {}

    return [
        {
            "user_id": p["user_id"],
            "email": email_map.get(p["user_id"], "—"),
            "naam": p.get("naam") or "—",
            "credits_balance": p.get("credits_balance", 0),
            "is_suspended": p.get("is_suspended", False),
            "referral_code": p.get("referral_code"),
            "created_at": p.get("created_at"),
            "last_active_at": p.get("last_active_at"),
            "application_count": app_count_map.get(p["user_id"], 0),
        }
        for p in profiles
    ]


@router.get("/stats")
async def admin_stats(
    _: None = Depends(_check_admin_key),
    supabase=Depends(get_supabase),
):
    """High-level platform stats for the admin dashboard."""
    profiles_result = supabase.table("profiles").select("user_id,credits_balance,is_suspended,created_at").execute()
    profiles = profiles_result.data or []

    apps_result = supabase.table("applications").select("status,created_at").execute()
    apps = apps_result.data or []

    waitlist_result = supabase.table("waitlist").select("id", count="exact").is_("invited_at", "null").execute()
    invite_codes_result = supabase.table("invite_codes").select("use_count,max_uses").execute()

    total_users = len(profiles)
    suspended = sum(1 for p in profiles if p.get("is_suspended"))
    total_credits = sum(p.get("credits_balance", 0) for p in profiles)

    total_apps = len(apps)
    sent = sum(1 for a in apps if a["status"] in ("sent", "pending"))
    replied = sum(1 for a in apps if a["status"] == "replied")
    interview = sum(1 for a in apps if a["status"] == "interview")

    codes = invite_codes_result.data or []
    total_uses = sum(c.get("use_count", 0) for c in codes)
    total_capacity = sum(c.get("max_uses", 0) for c in codes)

    return {
        "users": {
            "total": total_users,
            "suspended": suspended,
            "total_credits_balance": total_credits,
        },
        "applications": {
            "total": total_apps,
            "sent": sent,
            "replied": replied,
            "interview": interview,
        },
        "invites": {
            "waitlist_pending": waitlist_result.count or 0,
            "codes_used": total_uses,
            "codes_capacity": total_capacity,
        },
    }


@router.post("/users/{user_id}/credits")
async def adjust_credits(
    user_id: str,
    body: CreditAdjust,
    _: None = Depends(_check_admin_key),
    supabase=Depends(get_supabase),
):
    """Grant (positive delta) or debit (negative delta) credits. Recorded in ledger."""
    if body.delta == 0:
        raise HTTPException(status_code=422, detail="delta cannot be 0")

    profile_result = supabase.table("profiles").select("credits_balance").eq("user_id", user_id).maybe_single().execute()
    if not profile_result.data:
        raise HTTPException(status_code=404, detail="User not found")

    supabase.rpc("grant_credits", {
        "p_user_id": user_id,
        "p_delta": body.delta,
        "p_reason": body.reason,
        "p_reference_id": None,
    }).execute()

    new_balance_result = supabase.table("profiles").select("credits_balance,naam").eq("user_id", user_id).single().execute()
    new_balance = new_balance_result.data.get("credits_balance") if new_balance_result.data else None
    naam = (new_balance_result.data or {}).get("naam", "") or ""

    try:
        auth_user = supabase.auth.admin.get_user_by_id(user_id)
        user_email = auth_user.user.email if auth_user.user else None
        if user_email and new_balance is not None:
            await send_credits_adjusted(user_email, naam, body.delta, body.reason, new_balance)
    except Exception:
        logger.warning("Failed to send credits-adjusted email for user %s", user_id, exc_info=True)

    return {
        "user_id": user_id,
        "delta": body.delta,
        "new_balance": new_balance,
    }


@router.patch("/users/{user_id}/suspend")
async def toggle_suspend(
    user_id: str,
    body: SuspendUpdate,
    _: None = Depends(_check_admin_key),
    supabase=Depends(get_supabase),
):
    """Suspend or unsuspend a user account."""
    result = supabase.table("profiles").update({"is_suspended": body.suspended}).eq("user_id", user_id).select().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")
    naam = (result.data[0] or {}).get("naam", "") or ""

    try:
        auth_user = supabase.auth.admin.get_user_by_id(user_id)
        user_email = auth_user.user.email if auth_user.user else None
        if user_email:
            await send_account_suspended(user_email, naam, body.suspended)
    except Exception:
        logger.warning("Failed to send suspend-notification email for user %s", user_id, exc_info=True)

    return {"user_id": user_id, "is_suspended": body.suspended}


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    _: None = Depends(_check_admin_key),
    supabase=Depends(get_supabase),
):
    """Permanently delete a user account and all their data."""
    from uuid import UUID as _UUID
    try:
        _UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid user_id")

    profile_result = supabase.table("profiles").select("cv_path").eq("user_id", user_id).maybe_single().execute()
    if profile_result.data and profile_result.data.get("cv_path"):
        try:
            supabase.storage.from_(CV_BUCKET).remove([profile_result.data["cv_path"]])
        except Exception:
            pass

    supabase.auth.admin.delete_user(user_id)

    supabase.table("applications").delete().eq("user_id", user_id).execute()
    supabase.table("credit_transactions").delete().eq("user_id", user_id).execute()
    supabase.table("referral_uses").delete().eq("referrer_user_id", user_id).execute()
    supabase.table("referral_uses").delete().eq("referee_user_id", user_id).execute()
    # mollie_payments NOT deleted — 7-year Dutch tax retention obligation
    supabase.table("profiles").delete().eq("user_id", user_id).execute()

    return {"deleted": user_id}


# ── Cron endpoints ─────────────────────────────────────────────────────────────

@router.post("/cron/monthly-credits")
async def cron_monthly_credits(
    _: None = Depends(_check_admin_key),
    supabase=Depends(get_supabase),
):
    """
    Grant +1 credit to every user active in the last 30 days.
    Deduped per user per calendar month — safe to call multiple times.
    Run on the 1st of each month.
    """
    from datetime import date
    month_key = date.today().strftime("%Y-%m")
    since = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()

    profiles_result = (
        supabase.table("profiles")
        .select("user_id")
        .gte("last_active_at", since)
        .execute()
    )
    profiles = profiles_result.data or []
    if not profiles:
        return {"granted": 0, "skipped": 0}

    granted = 0
    skipped = 0

    for p in profiles:
        uid = p["user_id"]
        try:
            insert_result = supabase.table("notifications").insert({
                "user_id": uid,
                "type": "monthly_credit",
                "reference_id": month_key,
            }).execute()
            if not insert_result.data:
                skipped += 1
                continue
        except Exception:
            skipped += 1
            continue

        try:
            supabase.rpc("grant_credits", {
                "p_user_id": uid,
                "p_delta": 1,
                "p_reason": "monthly_engagement",
                "p_reference_id": month_key,
            }).execute()
            granted += 1
        except Exception:
            logger.warning("Monthly credit grant failed for user %s", uid, exc_info=True)
            skipped += 1

    logger.info("Monthly credits cron: granted=%d skipped=%d month=%s", granted, skipped, month_key)
    return {"granted": granted, "skipped": skipped, "month": month_key}


@router.post("/cron/follow-up")
async def cron_follow_up_reminder(
    _: None = Depends(_check_admin_key),
    supabase=Depends(get_supabase),
):
    """
    Find applications sent 13–15 days ago that are still open (no replied_at).
    Group by user and send one reminder per user. Deduped per application.
    """
    now = datetime.now(timezone.utc)
    window_start = (now - timedelta(days=15)).isoformat()
    window_end = (now - timedelta(days=13)).isoformat()

    apps_result = (
        supabase.table("applications")
        .select("id,user_id,company,job_title,status")
        .gte("created_at", window_start)
        .lte("created_at", window_end)
        .in_("status", ["sent", "pending"])
        .is_("replied_at", "null")
        .execute()
    )
    applications = apps_result.data or []
    if not applications:
        return {"sent": 0, "skipped": 0}

    by_user: dict[str, list[dict]] = {}
    for app in applications:
        by_user.setdefault(app["user_id"], []).append(app)

    sent = 0
    skipped = 0

    for uid, user_apps in by_user.items():
        fresh_apps = []
        for app in user_apps:
            try:
                insert_result = supabase.table("notifications").insert({
                    "user_id": uid,
                    "type": "follow_up_reminder",
                    "reference_id": app["id"],
                }).execute()
                if insert_result.data:
                    fresh_apps.append(app)
            except Exception:
                skipped += 1

        if not fresh_apps:
            continue

        try:
            auth_user = supabase.auth.admin.get_user_by_id(uid)
            user_email = auth_user.user.email if auth_user.user else None
            profile_result = supabase.table("profiles").select("naam,email_reminders_enabled").eq("user_id", uid).single().execute()
            if not profile_result.data or not profile_result.data.get("email_reminders_enabled", True):
                skipped += 1
                continue
            naam = profile_result.data.get("naam", "") if profile_result.data else ""
            if user_email:
                ok = await send_follow_up_reminder(user_email, naam, fresh_apps)
                sent += 1 if ok else 0
                skipped += 0 if ok else 1
        except Exception:
            logger.warning("Follow-up reminder failed for user %s", uid, exc_info=True)
            skipped += 1

    logger.info("Follow-up cron: sent=%d skipped=%d", sent, skipped)
    return {"sent": sent, "skipped": skipped}


@router.post("/cron/job-digest")
async def cron_job_digest(
    _: None = Depends(_check_admin_key),
    supabase=Depends(get_supabase),
):
    """
    For each user with an active profile (updated in last 60 days),
    search Adzuna for their functietitel + woonplaats and send a weekly digest.
    Deduped by ISO week number.
    """
    from datetime import date
    week_key = date.today().strftime("%Y-W%V")
    since = (datetime.now(timezone.utc) - timedelta(days=60)).isoformat()

    profiles_result = (
        supabase.table("profiles")
        .select("user_id,naam,functietitel,functietitel_2,functietitel_3,woonplaats")
        .gte("updated_at", since)
        .eq("email_digest_enabled", True)
        .execute()
    )
    profiles = profiles_result.data or []
    if not profiles:
        return {"sent": 0, "skipped": 0}

    sent = 0
    skipped = 0

    for profile in profiles:
        uid = profile["user_id"]
        titles = [t for t in [profile.get("functietitel"), profile.get("functietitel_2"), profile.get("functietitel_3")] if t]
        keywords = " ".join(titles)
        location = profile.get("woonplaats") or ""
        naam = profile.get("naam") or ""

        if not keywords:
            skipped += 1
            continue

        try:
            insert_result = supabase.table("notifications").insert({
                "user_id": uid,
                "type": "job_digest",
                "reference_id": week_key,
            }).execute()
            if not insert_result.data:
                skipped += 1
                continue
        except Exception:
            skipped += 1
            continue

        try:
            jobs = await scrape_adzuna(keywords, location, limit=5)
            if not jobs:
                skipped += 1
                continue

            auth_user = supabase.auth.admin.get_user_by_id(uid)
            user_email = auth_user.user.email if auth_user.user else None
            if not user_email:
                skipped += 1
                continue

            ok = await send_job_digest(user_email, naam, jobs[:5])
            sent += 1 if ok else 0
            skipped += 0 if ok else 1
        except Exception:
            logger.warning("Job digest failed for user %s", uid, exc_info=True)
            skipped += 1

        await asyncio.sleep(0.5)

    logger.info("Job digest cron: sent=%d skipped=%d week=%s", sent, skipped, week_key)
    return {"sent": sent, "skipped": skipped, "week": week_key}


# ── Job pool prefetch ──────────────────────────────────────────────────────────

_POPULAR_NL_SEARCHES = [
    "software developer", "administratief medewerker", "verkoopmedewerker",
    "marketing manager", "accountant", "chauffeur", "verpleegkundige",
    "klantenservice medewerker", "projectmanager", "data analist",
    "hr medewerker", "logistiek medewerker", "kok", "grafisch ontwerper",
    "recruiter", "financieel controller", "salesmanager",
    "productiemedewerker", "it beheerder", "boekhouder",
]


@router.post("/cron/prefetch-jobs")
async def cron_prefetch_jobs(
    _: None = Depends(_check_admin_key),
    supabase=Depends(get_supabase),
):
    """
    Pre-fetch popular Dutch job searches to warm the shared jobs pool.
    Run daily at 06:00 so users get instant DB results for common searches.
    """
    from uuid import uuid4 as _uuid4

    total_upserted = 0

    for keyword in _POPULAR_NL_SEARCHES:
        try:
            results = await scrape_adzuna(keyword, "", limit=20)
            if results:
                rows = [
                    {
                        "id": str(_uuid4()),
                        "title": j["title"],
                        "company": j["company"],
                        "location": j["location"],
                        "source": j["source"],
                        "url": j["url"],
                        "description_snippet": j.get("description_snippet"),
                        "salary_range": j.get("salary_range"),
                        "salary_hourly": j.get("salary_hourly"),
                        "salary_min_raw": j.get("salary_min_raw"),
                        "salary_max_raw": j.get("salary_max_raw"),
                        "contract_type": j.get("contract_type"),
                        "posted_at": j.get("posted_at"),
                        "scraped_at": j["scraped_at"],
                    }
                    for j in results
                ]
                supabase.table("jobs").upsert(rows, on_conflict="url").execute()
                total_upserted += len(rows)
        except Exception:
            logger.warning("Prefetch failed for keyword: %s", keyword, exc_info=True)

        await asyncio.sleep(1)  # avoid hammering Adzuna

    logger.info("Job prefetch cron: upserted=%d keywords=%d", total_upserted, len(_POPULAR_NL_SEARCHES))
    return {"upserted": total_upserted, "keywords": len(_POPULAR_NL_SEARCHES)}


# ── n8n ingest endpoint ────────────────────────────────────────────────────────

class IngestJob(BaseModel):
    title: str = Field(..., max_length=300)
    company: str = Field(..., max_length=200)
    url: AnyHttpUrl = Field(...)
    location: Optional[str] = Field(None, max_length=200)
    source: str = Field("adzuna", max_length=50)
    description_snippet: Optional[str] = Field(None, max_length=500)
    salary_range: Optional[str] = Field(None, max_length=100)
    salary_min_raw: Optional[int] = None
    salary_max_raw: Optional[int] = None
    contract_type: Optional[str] = Field(None, max_length=50)
    posted_at: Optional[str] = Field(None, max_length=50)
    scraped_at: Optional[str] = Field(None, max_length=50)


class IngestJobsBody(BaseModel):
    jobs: List[IngestJob] = Field(..., max_length=200)
    source_keyword: Optional[str] = Field(None, max_length=200)


@router.post("/ingest/jobs")
async def ingest_jobs(
    body: IngestJobsBody,
    _: None = Depends(_check_admin_key),
    supabase=Depends(get_supabase),
):
    """
    Receive a batch of vacancy objects from n8n and upsert to the shared jobs pool.
    Deduplicates by URL. Called by the n8n vacancy-polling workflow every 4 hours.
    """
    from uuid import uuid4 as _uuid4
    from datetime import datetime as _dt, timezone as _tz

    now = _dt.now(_tz.utc).isoformat()
    rows = []
    for j in body.jobs:
        if not j.title or not j.url:
            continue
        rows.append({
            "id": str(_uuid4()),
            "title": j.title,
            "company": j.company,
            "location": j.location or "Nederland",
            "source": j.source,
            "url": str(j.url),
            "description_snippet": j.description_snippet,
            "salary_range": j.salary_range,
            "salary_min_raw": j.salary_min_raw,
            "salary_max_raw": j.salary_max_raw,
            "contract_type": j.contract_type,
            "posted_at": j.posted_at,
            "scraped_at": j.scraped_at or now,
        })

    if rows:
        supabase.table("jobs").upsert(rows, on_conflict="url").execute()

    logger.info(
        "n8n ingest: upserted=%d keyword=%s",
        len(rows),
        body.source_keyword or "—",
    )
    return {"upserted": len(rows), "source_keyword": body.source_keyword}
