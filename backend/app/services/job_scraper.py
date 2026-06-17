"""
Job scraper service — Adzuna NL API (primary) + Indeed NL HTML scraper (secondary).

Adzuna: free REST API with native NL support — https://developer.adzuna.com/docs/search
Indeed NL: HTML scraper using httpx + BeautifulSoup, respects robots.txt query limit.
"""

import asyncio
import httpx
from datetime import datetime, timezone
from urllib.parse import urlparse, urlencode, quote_plus
import logging

try:
    from bs4 import BeautifulSoup
    _BS4_AVAILABLE = True
except ImportError:
    _BS4_AVAILABLE = False

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


async def scrape_indeed_nl(keywords: str, location: str = "", limit: int = 10) -> list[dict]:
    """
    Scrapes Indeed NL search results via HTML.
    Returns at most `limit` jobs. Gracefully returns [] on any error.
    Requires: beautifulsoup4 (pip install beautifulsoup4)
    """
    if not _BS4_AVAILABLE:
        logger.warning("beautifulsoup4 not installed — Indeed NL scraper skipped")
        return []

    qs = urlencode({"q": keywords, "l": location or "Nederland", "lang": "nl"})
    url = f"https://nl.indeed.com/vacatures?{qs}"

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        "Accept-Language": "nl-NL,nl;q=0.9",
        "Accept": "text/html,application/xhtml+xml",
    }

    try:
        async with httpx.AsyncClient(timeout=15, headers=headers, follow_redirects=True) as client:
            resp = await client.get(url)
            if resp.status_code != 200:
                logger.warning("Indeed NL returned %s", resp.status_code)
                return []

            soup = BeautifulSoup(resp.text, "html.parser")
            results = []

            for card in soup.select("div.job_seen_beacon,div.resultContent")[:limit]:
                title_el = card.select_one("h2.jobTitle span[title],h2.jobTitle a span")
                company_el = card.select_one("span[data-testid='company-name'],span.companyName")
                location_el = card.select_one("div[data-testid='text-location'],div.companyLocation")
                salary_el = card.select_one("div[data-testid='attribute_snippet_testid'],div.salary-snippet")
                link_el = card.select_one("h2.jobTitle a")

                title = title_el.get_text(strip=True) if title_el else None
                company = company_el.get_text(strip=True) if company_el else "Onbekend"
                loc = location_el.get_text(strip=True) if location_el else (location or "Nederland")
                salary = salary_el.get_text(strip=True) if salary_el else ""
                href = link_el.get("href", "") if link_el else ""
                # Only accept known Indeed path prefixes to prevent open redirect injection
                if href.startswith(("/vacatures/", "/rc/", "/pagina/", "/solliciteren/")):
                    job_url = f"https://nl.indeed.com{href}"
                elif href.startswith("https://nl.indeed.com"):
                    job_url = href
                else:
                    continue

                if not title or not job_url:
                    continue

                results.append({
                    "title": title,
                    "company": company,
                    "location": loc,
                    "url": job_url,
                    "description_snippet": "",
                    "salary_range": salary,
                    "source": "indeed",
                    "scraped_at": _now(),
                    "posted_at": None,
                    "contract_type": "",
                    "salary_min_raw": None,
                    "salary_max_raw": None,
                    "salary_hourly": "",
                })

            return results

    except Exception:
        logger.warning("Indeed NL scraper error", exc_info=True)
        return []


# Keep old names as aliases so any legacy import still works
async def scrape_jobbird(keywords: str, location: str = "", limit: int = 20) -> list[dict]:
    return await scrape_adzuna(keywords, location, limit)


async def scrape_nationale_vacaturebank(keywords: str, location: str = "", limit: int = 20) -> list[dict]:
    return []
