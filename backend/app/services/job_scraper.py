"""
Job scraper service — uses Adzuna NL API as primary source.

Adzuna provides a free REST API with native NL support.
Docs: https://developer.adzuna.com/docs/search
"""

import httpx
from datetime import datetime, timezone
from typing import Optional
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


async def scrape_adzuna(keywords: str, location: str = "", limit: int = 20) -> list[dict]:
    """Fetch jobs from Adzuna NL API."""
    if not settings.adzuna_app_id or not settings.adzuna_app_key:
        logger.warning("Adzuna API credentials not configured")
        return []

    params = {
        "app_id": settings.adzuna_app_id,
        "app_key": settings.adzuna_app_key,
        "results_per_page": min(limit, 50),
        "content-type": "application/json",
    }
    if keywords:
        params["what"] = keywords
    if location:
        params["where"] = location

    url = "https://api.adzuna.com/v1/api/jobs/nl/search/1"

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(url, params=params,
                                    headers={"User-Agent": "Opstap/1.0 (+https://opstap.nl)"})
            resp.raise_for_status()
    except httpx.HTTPError as exc:
        logger.warning("Adzuna API request failed: %s", type(exc).__name__)
        return []

    try:
        data = resp.json()
    except Exception:
        logger.warning("Adzuna API returned non-JSON response")
        return []

    results = []
    for job in data.get("results", []):
        results.append({
            "title": job.get("title", "").strip(),
            "company": job.get("company", {}).get("display_name", "Onbekend").strip(),
            "location": job.get("location", {}).get("display_name", location or "Nederland").strip(),
            "url": job.get("redirect_url", ""),
            "description_snippet": job.get("description", "")[:300],
            "source": "adzuna",
            "scraped_at": _now(),
            "contract_type": _contract_type(job),
            "salary_range": _salary(job),
        })

    return [r for r in results if r["title"] and r["url"]]


def _contract_type(job: dict) -> str:
    ct = job.get("contract_type") or ""
    pt = job.get("contract_time") or ""
    if ct == "permanent":
        return "Vast"
    if ct == "contract":
        return "Tijdelijk"
    if pt == "full_time":
        return "Fulltime"
    if pt == "part_time":
        return "Parttime"
    return ""


def _salary(job: dict) -> str:
    low = job.get("salary_min")
    high = job.get("salary_max")
    if low and high:
        return f"€{int(low):,} – €{int(high):,}".replace(",", ".")
    if low:
        return f"Vanaf €{int(low):,}".replace(",", ".")
    return ""


# Keep old names as aliases so jobs.py import still works
async def scrape_jobbird(keywords: str, location: str = "", limit: int = 20) -> list[dict]:
    return await scrape_adzuna(keywords, location, limit)


async def scrape_nationale_vacaturebank(keywords: str, location: str = "", limit: int = 20) -> list[dict]:
    return []
