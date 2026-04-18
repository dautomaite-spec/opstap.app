"""
Job scraper service — Phase 2 implementation.

Strategy per board:
  - Jobbird: Playwright headless (RSS feed removed by Jobbird in 2025)
  - Nationale Vacaturebank: public RSS + JSON API
  - Indeed NL: Playwright headless (used only as fallback)
  - LinkedIn NL: search via public job listings page

All scrapers return a list of raw dicts with a common schema.
Deduplication and scoring happen in the jobs API endpoint.
"""

import httpx
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# Shared schema keys every scraper must populate
_REQUIRED = {"title", "company", "location", "url", "source", "scraped_at"}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


async def scrape_jobbird(keywords: str, location: str = "", limit: int = 20) -> list[dict]:
    """
    Fetch jobs from Jobbird via Playwright headless browser.

    Jobbird removed their public RSS feed in 2025 (the old /nl/vacature-rss path
    now returns a 301 redirect to a plain HTML search page). We scrape the HTML
    search results page instead.

    Job cards on the results page use:
      - article[data-vacancy-id]  — the card container, data-vacancy-id holds the ID
      - [data-vacancy-id] a.title (or h2/h3 inside the card) — job title + href
      - .company or [class*='company'] — company name
      - .location or [class*='location'] — location string

    We fall back gracefully to an empty list so the other scrapers still run.
    """
    try:
        from playwright.async_api import async_playwright  # lazy import — not installed in test env
    except ImportError:
        logger.warning("Jobbird scraper: playwright not installed, returning empty")
        return []

    query = keywords.strip().replace(" ", "+")
    loc = location.strip().replace(" ", "+")
    search_url = f"https://www.jobbird.com/nl/vacatures?search={query}&location={loc}"

    results: list[dict] = []
    try:
        async with async_playwright() as pw:
            browser = await pw.chromium.launch(headless=True)
            page = await browser.new_page(
                user_agent="Opstap/1.0 (+https://opstap.nl)",
                locale="nl-NL",
            )
            await page.goto(search_url, wait_until="domcontentloaded", timeout=30_000)

            # Wait for at least one vacancy card to appear; bail if none after 8 s
            try:
                await page.wait_for_selector("article[data-vacancy-id]", timeout=8_000)
            except Exception:
                logger.warning("Jobbird: no vacancy cards found on page — possible structure change")
                await browser.close()
                return []

            cards = await page.query_selector_all("article[data-vacancy-id]")
            for card in cards[:limit]:
                # Title + URL: first anchor with a readable text inside the card
                title_el = await card.query_selector("a[href*='/nl/vacature/']")
                title = (await title_el.inner_text()).strip() if title_el else ""
                href = await title_el.get_attribute("href") if title_el else ""
                job_url = f"https://www.jobbird.com{href}" if href and href.startswith("/") else href

                # Company: look for common class patterns
                company_el = (
                    await card.query_selector("[class*='company']")
                    or await card.query_selector("[class*='employer']")
                )
                company = (await company_el.inner_text()).strip() if company_el else "Onbekend"

                # Location: look for common class patterns
                location_el = (
                    await card.query_selector("[class*='location']")
                    or await card.query_selector("[class*='place']")
                )
                job_location = (await location_el.inner_text()).strip() if location_el else (location or "Nederland")

                # Snippet
                snippet_el = await card.query_selector("[class*='description'], [class*='snippet'], p")
                snippet = (await snippet_el.inner_text()).strip()[:300] if snippet_el else ""

                if title and job_url:
                    results.append({
                        "title": title,
                        "company": company,
                        "location": job_location,
                        "url": job_url,
                        "description_snippet": snippet,
                        "source": "jobbird",
                        "scraped_at": _now(),
                    })

            await browser.close()
    except Exception as exc:
        logger.warning("Jobbird Playwright scrape failed: %s", exc)
        return []

    return results


async def scrape_nationale_vacaturebank(keywords: str, location: str = "", limit: int = 20) -> list[dict]:
    """Fetch jobs from Nationale Vacaturebank RSS feed."""
    query = "+".join(keywords.split())
    url = f"https://www.nationalevacaturebank.nl/vacature/rss?q={query}&location={location}"
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(url, headers={"User-Agent": "Opstap/1.0 (+https://opstap.nl)"})
            resp.raise_for_status()
    except httpx.HTTPError as exc:
        logger.warning("NVB RSS failed: %s", exc)
        return []

    root = ET.fromstring(resp.text)
    items = root.findall(".//item")
    results = []
    for item in items[:limit]:
        results.append({
            "title": _text(item, "title"),
            "company": _text(item, "source") or "Onbekend",
            "location": _text(item, "location") or location or "Nederland",
            "url": _text(item, "link"),
            "description_snippet": _text(item, "description", max_len=300),
            "source": "nationale_vacaturebank",
            "scraped_at": _now(),
        })
    return [r for r in results if all(r.get(k) for k in ("title", "url"))]


def _text(element, tag: str, max_len: Optional[int] = None) -> str:
    child = element.find(tag)
    if child is None or child.text is None:
        return ""
    text = child.text.strip()
    if max_len:
        text = text[:max_len]
    return text
