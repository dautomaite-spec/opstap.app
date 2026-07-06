import re
import asyncio
import logging
import threading
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, Field
from typing import Optional
from uuid import uuid4
from app.services.llm_job_search import _is_url_live

logger = logging.getLogger(__name__)

from app.core.supabase import get_supabase
from app.core.auth import get_current_user_id
from app.schemas.job import JobOut, JobSearchParams
from app.services.job_scraper import scrape_jobbird, scrape_nationale_vacaturebank, scrape_indeed_nl
from app.services.llm_job_search import llm_search_jobs

_LOCATION_REPLACEMENTS = {
    "netherlands": "Nederland",
    "the netherlands": "Nederland",
    "nederland": "Nederland",
    "holland": "Nederland",
}


_MAX_PER_COMPANY = 2

# Location fragments that indicate a non-Dutch job.
# LinkedIn and Indeed sometimes return remote/US jobs even when queried with NL params.
_NON_NL_FRAGMENTS: frozenset[str] = frozenset({
    "united states", "usa", "u.s.", "united kingdom", "germany", "deutschland",
    "france", "españa", "spain", "italy", "poland", "worldwide",
    # US state/city patterns. Use longer forms to avoid false positives on Dutch names.
    # "remote, " catches "Remote, US" / "Remote, CA" / etc.
    "remote, us", "remote, ca", "remote, uk",
    # Full US state names are unambiguous
    "new york", "california", "texas", "florida", "illinois", "washington, d",
    "san francisco", "los angeles", "chicago", "seattle", "austin",
})


def _is_nl_location(location: str | None) -> bool:
    """Return True if the location looks Dutch or is unset."""
    if not location:
        return True
    lower = location.lower()
    return not any(frag in lower for frag in _NON_NL_FRAGMENTS)


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

_FRESH_HOURS = 24  # DB results younger than this are served without re-scraping
_STALE_DAYS = 3    # Fallback cap — job listings expire fast; never return results older than this

# In-process rate limit: (count, window_start) per user_id
_llm_rate_state: dict[str, tuple[int, datetime]] = {}
_llm_rate_lock = threading.Lock()
_LLM_HOURLY_LIMIT = 10


def _check_llm_rate_limit(user_id: str, now: datetime) -> bool:
    """Return True if the user is within their hourly LLM search quota. Thread-safe."""
    with _llm_rate_lock:
        entry = _llm_rate_state.get(user_id)
        if entry:
            count, window_start = entry
            if (now - window_start).total_seconds() < 3600:
                if count >= _LLM_HOURLY_LIMIT:
                    return False
                _llm_rate_state[user_id] = (count + 1, window_start)
            else:
                _llm_rate_state[user_id] = (1, now)
        else:
            _llm_rate_state[user_id] = (1, now)
        # Evict expired windows to prevent unbounded growth
        expired = [uid for uid, (_, ws) in _llm_rate_state.items()
                   if (now - ws).total_seconds() >= 3600 and uid != user_id]
        for uid in expired:
            del _llm_rate_state[uid]
    return True



@router.post("/search", response_model=list[JobOut])
async def search_jobs(
    params: JobSearchParams,
    response: Response,
    user_id: str = Depends(get_current_user_id),
    supabase=Depends(get_supabase),
):
    # ── Fetch profile first — used for both cache and LLM search ─────────────
    profile: dict = {}
    try:
        p_result = supabase.table("profiles").select(
            "naam,functietitel,functietitel_2,functietitel_3,woonplaats,werklocatie,opleidingsniveau,extra_info,cv_structured"
        ).eq("user_id", user_id).maybe_single().execute()
        if p_result.data:
            profile = p_result.data
            # Supplement empty title slots from cv_structured.werkervaring
            cv_data = profile.pop("cv_structured", None) or {}
            werkervaring = cv_data.get("werkervaring") or []
            seen: set[str] = {
                t.lower() for t in [
                    profile.get("functietitel"),
                    profile.get("functietitel_2"),
                    profile.get("functietitel_3"),
                ] if t
            }
            for w in werkervaring:
                t = (w.get("functie") or "").strip()[:120]
                if not t or t.lower() in seen:
                    continue
                seen.add(t.lower())
                if not profile.get("functietitel"):
                    profile["functietitel"] = t
                elif not profile.get("functietitel_2"):
                    profile["functietitel_2"] = t
                elif not profile.get("functietitel_3"):
                    profile["functietitel_3"] = t
                else:
                    break
    except Exception as exc:
        logger.warning("Profile fetch failed for user %s: %s", user_id, exc)

    # Resolve keywords and location from params, falling back to profile
    keywords = (params.keywords or "").strip() or (profile.get("functietitel") or "")
    # Strip LIKE wildcards from user input so ilike behaves as a substring search, not open wildcard
    location = re.sub(r"[%_]", "", (params.location or "").strip()) or (profile.get("woonplaats") or "")

    now = datetime.now(timezone.utc)
    fresh_cutoff = (now - timedelta(hours=_FRESH_HOURS)).isoformat()

    # ── DB-first: check shared job pool for fresh matching results ────────────
    # text_search() changes the builder type to SyncQueryRequestBuilder which
    # lacks order/limit/filter — use client-side keyword filtering instead.
    db_query = supabase.table("jobs").select("*").gte("scraped_at", fresh_cutoff).is_("dead_at", "null")
    if location:
        db_query = db_query.ilike("location", f"%{location}%")
    cached_raw = [j for j in (db_query.order("scraped_at", desc=True).limit(min(params.limit * 4, 200)).execute().data or [])
                  if 'linkedin.com' not in (j.get('url') or '')]

    if keywords:
        # Use all three profile titles for broader cache matching
        all_titles = [t for t in [
            keywords,
            profile.get("functietitel_2"),
            profile.get("functietitel_3"),
        ] if t]
        kw_tokens = list({
            t.lower()
            for title in all_titles
            for t in re.sub(r"[^\w\s]", " ", title).split()
            if len(t) > 2
        })
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

    # ── Not enough fresh results — try LLM search first, fall back to scrapers ─
    # Per-user LLM search rate limit: 10 per hour, tracked in-process.
    # Single-worker deployment (Railway beta) — dict survives per process lifetime.
    if not _check_llm_rate_limit(user_id, now):
        response.headers["X-Jobs-Source"] = "cache"
        return _dedup_by_company(cached)[:params.limit] if cached else []

    raw = await llm_search_jobs(profile, keywords, location, params.limit, params.ui_language or "nl")

    if len(raw) < 5:
        # LLM search returned too few — supplement with scrapers.
        # Run Jobbird + NVB for each of the up-to-3 profile job titles so all
        # recent experience types are covered; Indeed + LinkedIn only for the primary.
        profile_titles = [t for t in [
            keywords,
            profile.get("functietitel_2"),
            profile.get("functietitel_3"),
        ] if t][:3]
        per_title_limit = max(params.limit // max(len(profile_titles), 1), 3)
        indeed_limit = min(params.limit // 2, 10)

        jb_coros = [scrape_jobbird(kw, location, per_title_limit) for kw in profile_titles]
        nvb_coros = [scrape_nationale_vacaturebank(kw, location, per_title_limit) for kw in profile_titles]
        jb_groups, nvb_groups, indeed_results = await asyncio.gather(
            asyncio.gather(*jb_coros),
            asyncio.gather(*nvb_coros),
            scrape_indeed_nl(keywords, location, indeed_limit),
        )
        flat = [j for group in (*jb_groups, *nvb_groups) for j in group]
        scraper_raw = [j for j in flat + indeed_results
                       if _is_nl_location(j.get("location"))]
        # Liveness-check scraper results (parallel HEAD) — same filter applied to LLM results above
        if scraper_raw:
            live_flags = await asyncio.gather(*[_is_url_live(j["url"]) for j in scraper_raw])
            dead = sum(1 for f in live_flags if not f)
            if dead:
                logger.info("Scraper liveness check: removed %d dead listing(s)", dead)
            scraper_raw = [j for j, live in zip(scraper_raw, live_flags) if live]
        # Merge: keep LLM results first (richer), append scraper results
        existing_urls = {j["url"] for j in raw}
        for j in scraper_raw:
            if j["url"] not in existing_urls:
                existing_urls.add(j["url"])
                raw.append(j)

    raw = [j for j in raw if _is_nl_location(j.get("location"))]

    if not raw:
        # Scrapers returned nothing — fall back to DB with a 14-day staleness cap
        stale_cutoff = (now - timedelta(days=_STALE_DAYS)).isoformat()
        fb_query = supabase.table("jobs").select("*").gte("scraped_at", stale_cutoff).is_("dead_at", "null")
        if location:
            fb_query = fb_query.ilike("location", f"%{location}%")
        fb_raw = [j for j in (fb_query.order("scraped_at", desc=True).limit(min(params.limit * 4, 200)).execute().data or [])
                  if 'linkedin.com' not in (j.get('url') or '')]
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

    # Build DB rows (no match_reason — it's user-specific, not stored in shared pool)
    db_rows = [
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
    supabase.table("jobs").upsert(db_rows, on_conflict="url").execute()

    # Attach transient fields for this session's response (not stored in DB)
    transient = {j["url"]: {"match_reason": j.get("match_reason"), "is_curveball": j.get("is_curveball", False)} for j in unique}
    response_rows = [
        {**row, "match_reason": transient.get(row["url"], {}).get("match_reason"), "is_curveball": transient.get(row["url"], {}).get("is_curveball")}
        for row in db_rows
    ]

    return _dedup_by_company(response_rows)[:params.limit]


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


# ── Dead link report (BEFORE /{job_id} to prevent route shadowing) ──────────

@router.post("/{job_id}/report-dead", status_code=204)
async def report_dead_job(
    job_id: str,
    user_id: str = Depends(get_current_user_id),
    supabase=Depends(get_supabase),
):
    """Mark a job as dead so it is filtered from all future cache results."""
    supabase.table("jobs").update({"dead_at": datetime.now(timezone.utc).isoformat()}).eq("id", job_id).is_("dead_at", "null").execute()
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
