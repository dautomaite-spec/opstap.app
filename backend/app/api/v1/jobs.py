import re
import asyncio
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, Field
from typing import Optional
from uuid import uuid4

from app.core.supabase import get_supabase
from app.core.auth import get_current_user_id
from app.schemas.job import JobOut, JobSearchParams
from app.services.job_scraper import (
    scrape_adzuna, scrape_indeed_nl, scrape_linkedin_nl,
    scrape_nationale_vacaturebank, scrape_jobbird, scrape_monsterboard, scrape_werkzoeken,
)

_LOCATION_REPLACEMENTS = {
    "netherlands": "Nederland",
    "the netherlands": "Nederland",
    "nederland": "Nederland",
    "holland": "Nederland",
}


_MAX_PER_COMPANY = 2


def _dedup_by_company(jobs: list[dict]) -> list[dict]:
    """Limit results to _MAX_PER_COMPANY per company to ensure diversity."""
    counts: dict[str, int] = {}
    out = []
    for job in jobs:
        key = (job.get("company") or "").strip().lower()
        if counts.get(key, 0) < _MAX_PER_COMPANY:
            counts[key] = counts.get(key, 0) + 1
            out.append(job)
    return out


def _normalize_location(loc: str | None) -> str:
    if not loc:
        return "Nederland"
    stripped = loc.strip()
    lower = stripped.lower()
    if lower in _LOCATION_REPLACEMENTS:
        return _LOCATION_REPLACEMENTS[lower]
    # Strip country suffix like ", Nederland" or ", Netherlands"
    for suffix in (", Nederland", ", Netherlands", ", Holland", ", NL"):
        if stripped.endswith(suffix):
            stripped = stripped[: -len(suffix)].strip()
    return stripped or "Nederland"

router = APIRouter(prefix="/jobs", tags=["jobs"])

_FRESH_HOURS = 6   # DB results younger than this are served without re-scraping
_STALE_DAYS = 14   # Fallback cap — never return results older than this



@router.post("/search", response_model=list[JobOut])
async def search_jobs(
    params: JobSearchParams,
    response: Response,
    user_id: str = Depends(get_current_user_id),
    supabase=Depends(get_supabase),
):
    keywords = (params.keywords or "").strip()
    location = (params.location or "").strip()

    now = datetime.now(timezone.utc)
    fresh_cutoff = (now - timedelta(hours=_FRESH_HOURS)).isoformat()

    # ── DB-first: check shared job pool for fresh matching results ────────────
    # text_search() changes the builder type to SyncQueryRequestBuilder which
    # lacks order/limit/filter — use client-side keyword filtering instead.
    db_query = supabase.table("jobs").select("*").gte("scraped_at", fresh_cutoff)
    if location:
        db_query = db_query.ilike("location", f"%{location}%")
    cached_raw = (db_query.order("scraped_at", desc=True).limit(params.limit * 4).execute().data or [])

    if keywords:
        kw_tokens = [t.lower() for t in re.sub(r"[^\w\s]", " ", keywords).split() if t]
        cached = [
            j for j in cached_raw
            if not kw_tokens or any(
                t in (j.get("title") or "").lower() or t in (j.get("description_snippet") or "").lower()
                for t in kw_tokens
            )
        ]
    else:
        cached = cached_raw

    if len(cached) >= 10:
        return _dedup_by_company(cached)[:params.limit]

    # ── Not enough fresh results — hit the scrapers ───────────────────────────
    adzuna_limit = params.limit
    indeed_limit = min(params.limit // 2, 10)
    linkedin_limit = min(params.limit // 3, 5)
    board_limit = 8
    (
        adzuna_results, indeed_results, linkedin_results,
        nvb_results, jobbird_results, monsterboard_results, werkzoeken_results,
    ) = await asyncio.gather(
        scrape_adzuna(keywords, location, adzuna_limit),
        scrape_indeed_nl(keywords, location, indeed_limit),
        scrape_linkedin_nl(keywords, location, linkedin_limit),
        scrape_nationale_vacaturebank(keywords, location, board_limit),
        scrape_jobbird(keywords, location, board_limit),
        scrape_monsterboard(keywords, location, board_limit),
        scrape_werkzoeken(keywords, location, board_limit),
    )
    raw = (
        adzuna_results + indeed_results + linkedin_results
        + nvb_results + jobbird_results + monsterboard_results + werkzoeken_results
    )

    if not raw:
        # Scrapers returned nothing — fall back to DB with a 14-day staleness cap
        stale_cutoff = (now - timedelta(days=_STALE_DAYS)).isoformat()
        fb_query = supabase.table("jobs").select("*").gte("scraped_at", stale_cutoff)
        if location:
            fb_query = fb_query.ilike("location", f"%{location}%")
        fb_raw = fb_query.order("scraped_at", desc=True).limit(params.limit * 4).execute().data or []
        if keywords:
            kw_tokens = [t.lower() for t in re.sub(r"[^\w\s]", " ", keywords).split() if t]
            stale_results = [
                j for j in fb_raw
                if not kw_tokens or any(
                    t in (j.get("title") or "").lower() or t in (j.get("description_snippet") or "").lower()
                    for t in kw_tokens
                )
            ] or cached
        else:
            stale_results = fb_raw or cached
        response.headers["X-Jobs-Source"] = "cache"
        return _dedup_by_company(stale_results)[:params.limit]

    # Deduplicate by URL then upsert to shared pool
    seen: set[str] = set()
    unique = []
    for job in raw:
        if job["url"] not in seen:
            seen.add(job["url"])
            unique.append(job)

    rows = [
        {
            "id": str(uuid4()),
            "title": j["title"],
            "company": j["company"],
            "location": _normalize_location(j.get("location")),
            "source": j["source"],
            "url": j["url"],
            "description_snippet": j.get("description_snippet"),
            "salary_range": j.get("salary_range"),
            "salary_min_raw": j.get("salary_min_raw"),
            "salary_max_raw": j.get("salary_max_raw"),
            "contract_type": j.get("contract_type"),
            "posted_at": j.get("posted_at"),
            "scraped_at": j["scraped_at"],
        }
        for j in unique
    ]
    supabase.table("jobs").upsert(rows, on_conflict="url").execute()

    return _dedup_by_company(rows)[:params.limit]


# ── Saved jobs (declared BEFORE /{job_id} to prevent route shadowing) ───────

class SavedJobData(BaseModel):
    """Strict schema for job data stored in saved_jobs — prevents unbounded blob storage."""
    title: str = Field(..., max_length=300)
    company: str = Field(..., max_length=200)
    url: str = Field(..., max_length=1000)
    location: Optional[str] = Field(None, max_length=200)
    source: Optional[str] = Field(None, max_length=50)
    description_snippet: Optional[str] = Field(None, max_length=500)
    salary_range: Optional[str] = Field(None, max_length=100)
    contract_type: Optional[str] = Field(None, max_length=50)
    posted_at: Optional[str] = Field(None, max_length=50)
    scraped_at: Optional[str] = Field(None, max_length=50)


class SaveJobBody(BaseModel):
    job_id: str = Field(..., max_length=100)
    job_data: SavedJobData


@router.get("/saved/list")
async def list_saved_jobs(
    user_id: str = Depends(get_current_user_id),
    supabase=Depends(get_supabase),
):
    result = supabase.table("saved_jobs").select("job_id,job_data,saved_at").eq("user_id", user_id).order("saved_at", desc=True).execute()
    return result.data or []


@router.post("/saved", status_code=201)
async def save_job(
    body: SaveJobBody,
    user_id: str = Depends(get_current_user_id),
    supabase=Depends(get_supabase),
):
    supabase.table("saved_jobs").upsert(
        {"user_id": user_id, "job_id": body.job_id, "job_data": body.job_data.model_dump()},
        on_conflict="user_id,job_id",
    ).execute()
    return {"saved": True}


@router.delete("/saved/{job_id}", status_code=204)
async def unsave_job(
    job_id: str,
    user_id: str = Depends(get_current_user_id),
    supabase=Depends(get_supabase),
):
    supabase.table("saved_jobs").delete().eq("user_id", user_id).eq("job_id", job_id).execute()
    return None


# ── Single job lookup (AFTER /saved/* to avoid route shadowing) ─────────────

@router.get("/{job_id}", response_model=JobOut)
async def get_job(
    job_id: str,
    user_id: str = Depends(get_current_user_id),
    supabase=Depends(get_supabase),
):
    result = supabase.table("jobs").select("*").eq("id", job_id).maybe_single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Job not found")
    return result.data
