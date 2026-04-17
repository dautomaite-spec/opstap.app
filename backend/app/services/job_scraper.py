"""
Job scraper service — Phase 2 implementation.

Strategy per board:
  - Jobbird: RSS feed (no scraping needed, public XML)
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
    """Fetch jobs from Jobbird RSS feed — no auth required."""
    query = "+".join(keywords.split())
    url = f"https://www.jobbird.com/nl/vacature-rss?search={query}&location={location}"
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(url, headers={"User-Agent": "Opstap/1.0 (+https://opstap.nl)"})
            resp.raise_for_status()
    except httpx.HTTPError as exc:
        logger.warning("Jobbird RSS failed: %s", exc)
        return []

    root = ET.fromstring(resp.text)
    items = root.findall(".//item")
    results = []
    for item in items[:limit]:
        results.append({
            "title": _text(item, "title"),
            "company": _text(item, "author") or _text(item, "dc:creator") or "Onbekend",
            "location": location or "Nederland",
            "url": _text(item, "link"),
            "description_snippet": _text(item, "description", max_len=300),
            "source": "jobbird",
            "scraped_at": _now(),
        })
    return [r for r in results if all(r.get(k) for k in ("title", "url"))]


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
