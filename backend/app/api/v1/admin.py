"""
Admin cron endpoints — protected by X-Admin-Key header.

Call these from an external scheduler (cron-job.org, GitHub Actions, etc.):
  POST /api/v1/admin/cron/follow-up   — Sundays, triggers follow-up reminder emails
  POST /api/v1/admin/cron/job-digest  — Mondays, sends weekly job digest to active users
"""

import asyncio
import logging
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, Header
from typing import Optional

from app.core.config import settings
from app.core.supabase import get_supabase
from app.services.job_scraper import scrape_adzuna
from app.services.email_notifications import send_follow_up_reminder, send_job_digest

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["admin"])


def _check_admin_key(x_admin_key: Optional[str] = Header(None)):
    if not settings.admin_api_key:
        raise HTTPException(status_code=503, detail="Admin key not configured")
    if x_admin_key != settings.admin_api_key:
        raise HTTPException(status_code=403, detail="Forbidden")


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

    # Group by user
    by_user: dict[str, list[dict]] = {}
    for app in applications:
        by_user.setdefault(app["user_id"], []).append(app)

    sent = 0
    skipped = 0

    for user_id, user_apps in by_user.items():
        # Dedup per application — skip already-reminded ones
        fresh_apps = []
        for app in user_apps:
            try:
                insert_result = supabase.table("notifications").insert({
                    "user_id": user_id,
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
            auth_user = supabase.auth.admin.get_user_by_id(user_id)
            user_email = auth_user.user.email if auth_user.user else None
            profile_result = supabase.table("profiles").select("naam").eq("user_id", user_id).single().execute()
            naam = profile_result.data.get("naam", "") if profile_result.data else ""
            if user_email:
                ok = send_follow_up_reminder(user_email, naam, fresh_apps)
                if ok:
                    sent += 1
                else:
                    skipped += 1
        except Exception:
            logger.warning("Follow-up reminder failed for user %s", user_id, exc_info=True)
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
        .select("user_id,naam,functietitel,woonplaats")
        .gte("updated_at", since)
        .execute()
    )
    profiles = profiles_result.data or []
    if not profiles:
        return {"sent": 0, "skipped": 0}

    sent = 0
    skipped = 0

    for profile in profiles:
        user_id = profile["user_id"]
        keywords = profile.get("functietitel") or ""
        location = profile.get("woonplaats") or ""
        naam = profile.get("naam") or ""

        if not keywords:
            skipped += 1
            continue

        # Dedup — one digest per user per week
        try:
            insert_result = supabase.table("notifications").insert({
                "user_id": user_id,
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

            auth_user = supabase.auth.admin.get_user_by_id(user_id)
            user_email = auth_user.user.email if auth_user.user else None
            if not user_email:
                skipped += 1
                continue

            ok = send_job_digest(user_email, naam, jobs[:5])
            if ok:
                sent += 1
            else:
                skipped += 1
        except Exception:
            logger.warning("Job digest failed for user %s", user_id, exc_info=True)
            skipped += 1

        # Small delay to respect Adzuna rate limits
        await asyncio.sleep(0.5)

    logger.info("Job digest cron: sent=%d skipped=%d week=%s", sent, skipped, week_key)
    return {"sent": sent, "skipped": skipped, "week": week_key}
