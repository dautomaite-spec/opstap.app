from fastapi import APIRouter, Depends, HTTPException
from uuid import uuid4
from datetime import datetime, timezone

from app.core.supabase import get_supabase
from app.schemas.job import JobOut, JobSearchParams
from app.services.job_scraper import scrape_jobbird, scrape_nationale_vacaturebank

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.post("/search", response_model=list[JobOut])
async def search_jobs(
    params: JobSearchParams,
    user_id: str,  # TODO: JWT dep
    supabase=Depends(get_supabase),
):
    keywords = params.keywords or ""
    location = params.location or ""
    limit_per_source = max(params.limit // 2, 5)

    # Scrape both RSS sources in parallel using asyncio.gather
    import asyncio
    jobbird, nvb = await asyncio.gather(
        scrape_jobbird(keywords, location, limit_per_source),
        scrape_nationale_vacaturebank(keywords, location, limit_per_source),
    )

    raw = jobbird + nvb
    if not raw:
        return []

    # Deduplicate by URL
    seen: set[str] = set()
    unique = []
    for job in raw:
        if job["url"] not in seen:
            seen.add(job["url"])
            unique.append(job)

    # Store in DB (upsert by URL)
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
async def get_job(job_id: str, supabase=Depends(get_supabase)):
    result = supabase.table("jobs").select("*").eq("id", job_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Job not found")
    return result.data
