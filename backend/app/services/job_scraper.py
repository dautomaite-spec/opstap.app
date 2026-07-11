"""
Job scraper service — Jobbird NL + Nationale Vacaturebank + Indeed NL + LinkedIn NL HTML scrapers.

Adzuna is kept as a fallback (admin weekly digest) but no longer used in user-facing search.
Primary sources: Jobbird (NL-native, no auth), NVB (NL-native, no auth).
Secondary: Indeed NL, LinkedIn NL (HTML/guest API).
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


async def scrape_linkedin_nl(keywords: str, location: str = "", limit: int = 5) -> list[dict]:
    """
    Scrapes LinkedIn NL via the public guest jobs API (no auth required).
    Returns at most `limit` jobs (keep low — shared IP rate-limits quickly).
    Gracefully returns [] on 429, bot-detection, or any error.
    """
    if not _BS4_AVAILABLE:
        logger.warning("beautifulsoup4 not installed — LinkedIn NL scraper skipped")
        return []

    params = urlencode({
        "keywords": keywords,
        "location": location or "Nederland",
        "geoId": "102890719",  # LinkedIn geoId for Netherlands - hard-restricts to NL
        "f_TPR": "r86400",     # posted in last 24h
        "start": "0",
    })
    url = f"https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?{params}"

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        "Accept-Language": "nl-NL,nl;q=0.9",
        "Accept": "text/html,application/xhtml+xml",
    }

    try:
        async with httpx.AsyncClient(timeout=15, headers=headers, follow_redirects=True) as client:
            resp = await client.get(url)
            if resp.status_code == 429:
                logger.warning("LinkedIn NL guest API rate-limited (429)")
                return []
            if resp.status_code != 200:
                logger.warning("LinkedIn NL returned %s", resp.status_code)
                return []

            soup = BeautifulSoup(resp.text, "html.parser")
            results = []

            for card in soup.select("div.base-card,li.jobs-search__results-list > div")[:limit]:
                title_el = card.select_one("h3.base-search-card__title")
                company_el = card.select_one("h4.base-search-card__subtitle")
                location_el = card.select_one("span.job-search-card__location")
                time_el = card.select_one("time")
                link_el = card.select_one("a.base-card__full-link,a[href*='/jobs/view/']")

                title = title_el.get_text(strip=True) if title_el else None
                company = company_el.get_text(strip=True) if company_el else "Onbekend"
                loc = location_el.get_text(strip=True) if location_el else (location or "Nederland")
                href = link_el.get("href", "") if link_el else ""

                # Only accept LinkedIn job view URLs to prevent open redirect injection
                parsed = urlparse(href)
                if parsed.netloc not in ("www.linkedin.com", "linkedin.com") or "/jobs/view/" not in parsed.path:
                    continue

                # Strip query/fragment — clean canonical URL
                job_url = f"https://www.linkedin.com{parsed.path}"

                if not title or not job_url:
                    continue

                posted_at = None
                if time_el and time_el.get("datetime"):
                    try:
                        posted_at = datetime.fromisoformat(
                            time_el["datetime"].replace("Z", "+00:00")
                        ).isoformat()
                    except ValueError:
                        pass

                results.append({
                    "title": title,
                    "company": company,
                    "location": loc,
                    "url": job_url,
                    "description_snippet": "",
                    "salary_range": "",
                    "source": "linkedin",
                    "scraped_at": _now(),
                    "posted_at": posted_at,
                    "contract_type": "",
                    "salary_min_raw": None,
                    "salary_max_raw": None,
                    "salary_hourly": "",
                })

            return results

    except Exception:
        logger.warning("LinkedIn NL scraper error", exc_info=True)
        return []


async def scrape_jobbird(keywords: str, location: str = "", limit: int = 20) -> list[dict]:
    """Scrapes Jobbird.nl — Dutch-native job board, no auth required."""
    if not _BS4_AVAILABLE:
        logger.warning("beautifulsoup4 not installed — Jobbird scraper skipped")
        return []

    qs = urlencode({"s": keywords, "locatie": location or ""}, quote_via=quote_plus)
    url = f"https://www.jobbird.com/nl/vacature?{qs}"

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        "Accept-Language": "nl-NL,nl;q=0.9",
        "Accept": "text/html,application/xhtml+xml",
    }

    try:
        async with httpx.AsyncClient(timeout=15, headers=headers, follow_redirects=True) as client:
            resp = await client.get(url)
            if resp.status_code != 200:
                logger.warning("Jobbird returned %s", resp.status_code)
                return []

            soup = BeautifulSoup(resp.text, "html.parser")
            results = []

            # Jobbird renders jobs as div.job-search__result-list__result (current markup)
            cards = soup.select(
                "div.job-search__result-list__result, "
                "article.job, article[class*='job'], div.job-result, div[class*='vacancyitem'], li.job-list-item"
            )
            if not cards:
                # Broader fallback: any article with a link containing /nl/vacature/
                cards = [a.find_parent("article") or a.find_parent("div") for a in soup.select("a[href*='/nl/vacature/']")]
                cards = [c for c in cards if c][:limit * 2]

            seen_urls: set[str] = set()
            for card in cards[:limit * 2]:
                link_el = card.select_one("a[href*='/nl/vacature/']") if card else None
                if not link_el:
                    continue
                href = link_el.get("href", "")
                parsed = urlparse(href)
                if parsed.netloc and parsed.netloc not in ("www.jobbird.com", "jobbird.com"):
                    continue
                if parsed.netloc:
                    job_url = f"https://www.jobbird.com{parsed.path}"
                else:
                    job_url = f"https://www.jobbird.com{href.split('?')[0]}"
                if job_url in seen_urls:
                    continue
                seen_urls.add(job_url)

                title_el = (card.select_one("h2 a, h3 a, .job-title a, .title a")
                            or card.select_one("h2, h3, .job-title, .title"))
                company_el = (card.select_one(".cro-recruiter-name")
                              or card.select_one(".company, .employer, .company-name, [class*='company']"))
                location_el = (card.select_one(".cro-job-location")
                               or card.select_one(".location, .city, [class*='location'], [class*='place']"))
                logo_el = card.select_one(".job-search__logo img[alt]")

                title = (title_el.get_text(strip=True) if title_el else link_el.get_text(strip=True))[:300]
                company = (company_el.get_text(strip=True) if company_el else None) \
                    or (logo_el.get("alt", "").strip() if logo_el else None) or "Onbekend"
                company = company[:200]
                loc = (location_el.get_text(strip=True) if location_el else (location or "Nederland"))[:200]

                if not title:
                    continue

                results.append({
                    "title": title,
                    "company": company,
                    "location": loc,
                    "url": job_url,
                    "description_snippet": "",
                    "salary_range": "",
                    "source": "jobbird",
                    "scraped_at": _now(),
                    "posted_at": None,
                    "contract_type": "",
                    "salary_min_raw": None,
                    "salary_max_raw": None,
                    "salary_hourly": "",
                })
                if len(results) >= limit:
                    break

            return results

    except Exception:
        logger.warning("Jobbird scraper error", exc_info=True)
        return []


async def scrape_nationale_vacaturebank(keywords: str, location: str = "", limit: int = 20) -> list[dict]:
    """Scrapes Nationale Vacaturebank — major Dutch job board, no auth required."""
    if not _BS4_AVAILABLE:
        logger.warning("beautifulsoup4 not installed — NVB scraper skipped")
        return []

    qs = urlencode({"query": keywords, "locatie": location or ""}, quote_via=quote_plus)
    url = f"https://www.nationalevacaturebank.nl/vacature/zoeken/?{qs}"

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        "Accept-Language": "nl-NL,nl;q=0.9",
        "Accept": "text/html,application/xhtml+xml",
    }

    try:
        async with httpx.AsyncClient(timeout=15, headers=headers, follow_redirects=True) as client:
            resp = await client.get(url)
            if resp.status_code != 200:
                logger.warning("NVB returned %s", resp.status_code)
                return []

            soup = BeautifulSoup(resp.text, "html.parser")
            results = []

            cards = soup.select("article.vacancyCard, div.vacancyCard, div[class*='vacancy-card'], li[class*='vacancy']")
            if not cards:
                cards = [a.find_parent("article") or a.find_parent("li") or a.find_parent("div")
                         for a in soup.select("a[href*='/vacature/']")]
                cards = [c for c in cards if c][:limit * 2]

            seen_urls: set[str] = set()
            for card in cards[:limit * 2]:
                link_el = card.select_one("a[href*='/vacature/']") if card else None
                if not link_el:
                    continue
                href = link_el.get("href", "")
                parsed = urlparse(href)
                if parsed.netloc and parsed.netloc not in ("www.nationalevacaturebank.nl", "nationalevacaturebank.nl"):
                    continue
                if parsed.netloc:
                    job_url = f"https://www.nationalevacaturebank.nl{parsed.path}"
                else:
                    job_url = f"https://www.nationalevacaturebank.nl{href.split('?')[0]}"
                if job_url in seen_urls:
                    continue
                seen_urls.add(job_url)

                title_el = card.select_one("h2 a, h3 a, h2, h3, .title, .job-title, [class*='title']")
                company_el = card.select_one(".company, .employer, [class*='company'], [class*='employer']")
                location_el = card.select_one(".location, [class*='location'], [class*='place'], [class*='city']")
                salary_el = card.select_one(".salary, [class*='salary'], [class*='salaris']")

                title = (title_el.get_text(strip=True) if title_el else link_el.get_text(strip=True))[:300]
                company = (company_el.get_text(strip=True) if company_el else "Onbekend")[:200]
                loc = (location_el.get_text(strip=True) if location_el else (location or "Nederland"))[:200]
                salary = (salary_el.get_text(strip=True) if salary_el else "")[:100]

                if not title:
                    continue

                results.append({
                    "title": title,
                    "company": company,
                    "location": loc,
                    "url": job_url,
                    "description_snippet": "",
                    "salary_range": salary,
                    "source": "nvb",
                    "scraped_at": _now(),
                    "posted_at": None,
                    "contract_type": "",
                    "salary_min_raw": None,
                    "salary_max_raw": None,
                    "salary_hourly": "",
                })
                if len(results) >= limit:
                    break

            return results

    except Exception:
        logger.warning("NVB scraper error", exc_info=True)
        return []
