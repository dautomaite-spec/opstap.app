import asyncio
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from uuid import uuid4

from app.core.supabase import get_supabase
from app.core.auth import get_current_user_id
from app.schemas.job import JobOut, JobSearchParams
from app.services.job_scraper import scrape_adzuna, scrape_indeed_nl

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.post("/search", response_model=list[JobOut])
async def search_jobs(
    params: JobSearchParams,
    user_id: str = Depends(get_current_user_id),
    supabase=Depends(get_supabase),
):
    keywords = params.keywords or ""
    location = params.location or ""

    adzuna_limit = params.limit
    indeed_limit = min(params.limit // 2, 10)
    adzuna_results, indeed_results = await asyncio.gather(
        scrape_adzuna(keywords, location, adzuna_limit),
        scrape_indeed_nl(keywords, location, indeed_limit),
    )
    raw = adzuna_results + indeed_results
    if not raw:
        # Scrapers returned nothing — fall back to cached jobs in DB for this user
        existing = supabase.table("jobs").select("*").eq("scraped_for_user", user_id).limit(params.limit).execute()
        return existing.data or []

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
            "scraped_for_user": user_id,
        }
        for j in unique
    ]
    supabase.table("jobs").upsert(rows, on_conflict="url").execute()

    return rows[: params.limit]


@router.get("/{job_id}", response_model=JobOut)
async def get_job(
    job_id: str,
    user_id: str = Depends(get_current_user_id),
    supabase=Depends(get_supabase),
):
    result = supabase.table("jobs").select("*").eq("id", job_id).eq("scraped_for_user", user_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Job not found")
    return result.data


# ── Saved jobs ─────────────────────────────────────────────────────────────

class SaveJobBody(BaseModel):
    job_id: str
    job_data: dict


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
        {"user_id": user_id, "job_id": body.job_id, "job_data": body.job_data},
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
