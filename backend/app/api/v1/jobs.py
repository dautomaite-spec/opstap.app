import asyncio
from fastapi import APIRouter, Depends, HTTPException
from uuid import uuid4

from app.core.supabase import get_supabase
from app.core.auth import get_current_user_id
from app.schemas.job import JobOut, JobSearchParams
from app.services.job_scraper import scrape_jobbird, scrape_nationale_vacaturebank

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.post("/search", response_model=list[JobOut])
async def search_jobs(
    params: JobSearchParams,
    user_id: str = Depends(get_current_user_id),
    supabase=Depends(get_supabase),
):
    keywords = params.keywords or ""
    location = params.location or ""
    limit_per_source = max(params.limit // 2, 5)

    jobbird, nvb = await asyncio.gather(
        scrape_jobbird(keywords, location, limit_per_source),
        scrape_nationale_vacaturebank(keywords, location, limit_per_source),
    )

    raw = jobbird + nvb
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
            "scraped_at": j["scraped_at"],
            "scraped_for_user": user_id,
        }
        for j in unique
    ]
    supabase.table("jobs").upsert(rows, on_conflict="url").execute()

    return unique[: params.limit]


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
