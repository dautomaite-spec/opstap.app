"""
Job scraper service — uses Adzuna NL API as primary source.

Adzuna provides a free REST API with native NL support.
Docs: https://developer.adzuna.com/docs/search
"""

import asyncio
import httpx
from datetime import datetime, timezone
from urllib.parse import urlparse
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

# Domains whose jobs are blocked by default — these employer platforms require
# users to register and apply on their own site, making Opstap's flow useless.
# Companies can be whitelisted later via a paid promoted-listing product.
BLOCKED_DOMAINS: frozenset[str] = frozenset({
    "werkenbijdefensie.nl",
    "defensie.nl",
    "werkenvoornederland.nl",
    "politie.nl",
    "werkenbijpolitie.nl",
    "werkenbijrijksoverheid.nl",
    "rijksoverheid.nl",
    "gemeentebanen.nl",
    "intermediair.nl",    # own platform, not direct apply
})


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


async def _resolve_domain(url: str, client: httpx.AsyncClient) -> str:
    """Follow redirect to extract the final destination domain (bare, no www.)."""
    try:
        resp = await client.head(url, follow_redirects=True, timeout=5)
        host = urlparse(str(resp.url)).netloc.lower()
        return host.lstrip("www.")
    except Exception:
        return ""


async def scrape_adzuna(keywords: str, location: str = "", limit: int = 20) -> list[dict]:
    """Fetch jobs from Adzuna NL API, stripping jobs from blocked employer platforms."""
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

    api_url = "https://api.adzuna.com/v1/api/jobs/nl/search/1"

    try:
        async with httpx.AsyncClient(
            timeout=15,
            headers={"User-Agent": "Opstap/1.0 (+https://opstapapp.nl)"},
        ) as client:
            resp = await client.get(api_url, params=params)
            resp.raise_for_status()
            data = resp.json()

            raw_results = []
            for job in data.get("results", []):
                raw_created = job.get("created")
                try:
                    posted_at = datetime.fromisoformat(
                        raw_created.replace("Z", "+00:00")
                    ).isoformat() if raw_created else None
                except (ValueError, AttributeError):
                    posted_at = None
                redirect_url = job.get("redirect_url", "")
                if not job.get("title") or not redirect_url:
                    continue
                sal_min = job.get("salary_min")
                sal_max = job.get("salary_max")
                raw_results.append({
                    "title": job.get("title", "").strip(),
                    "company": job.get("company", {}).get("display_name", "Onbekend").strip(),
                    "location": job.get("location", {}).get("display_name", location or "Nederland").strip(),
                    "url": redirect_url,
                    "description_snippet": job.get("description", "")[:300],
                    "source": "adzuna",
                    "scraped_at": _now(),
                    "posted_at": posted_at,
                    "contract_type": _contract_type(job),
                    "salary_range": _salary(job),
                    "salary_min_raw": int(sal_min) if sal_min else None,
                    "salary_max_raw": int(sal_max) if sal_max else None,
                    "salary_hourly": _salary_hourly(sal_min, sal_max),
                })

            if not raw_results:
                return []

            # Resolve final destination domain in parallel and filter blocked ones
            domains = await asyncio.gather(
                *[_resolve_domain(r["url"], client) for r in raw_results]
            )

    except httpx.HTTPError as exc:
        logger.warning("Adzuna API request failed: %s", type(exc).__name__)
        return []
    except Exception:
        logger.warning("Adzuna scraper error", exc_info=True)
        return []

    allowed = []
    for job, domain in zip(raw_results, domains):
        if domain and domain in BLOCKED_DOMAINS:
            logger.debug("Filtered blocked domain %s (%s)", domain, job["title"])
            continue
        allowed.append(job)

    return allowed


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


def _salary_hourly(sal_min, sal_max) -> str:
    """Calculate approximate hourly rate from annual Adzuna salary (assumes 40h/week FT)."""
    annual = None
    if sal_min and sal_max:
        annual = (int(sal_min) + int(sal_max)) / 2
    elif sal_min:
        annual = int(sal_min)
    if not annual or annual < 5000:
        return ""
    hourly = round(annual / 2080)
    return f"≈ €{hourly}/uur"


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
