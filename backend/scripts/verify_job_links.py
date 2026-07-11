"""
Cheap link-integrity + geography check for job search results.

For each job returned by llm_search_jobs(), applies the same NL-location
filter the API route uses (llm_search_jobs itself doesn't apply it — only
jobs.py does), fetches the destination page, and checks:
  1. Alive (HTTP GET succeeds, no dead-listing signals)
  2. Content actually contains the claimed job title (or a close variant) —
     cheap substring/token-overlap match, no LLM/vision involved
  3. Location isn't a non-NL fragment (country names, US cities, etc.),
     checked both on the claimed `location` field and on the fetched page text

No browser, no vision model, no registration flow.

Usage: python scripts/verify_job_links.py [n_runs]
"""

import asyncio
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import httpx  # noqa: E402

from app.services.llm_job_search import llm_search_jobs, _URL_CHECK_HEADERS  # noqa: E402
from app.api.v1.jobs import _is_nl_location  # noqa: E402

# Page-content geo check uses a tighter list than production's _NON_NL_FRAGMENTS —
# that list is meant for the structured `location` field, not full page prose,
# where "worldwide"/company-boilerplate causes false positives (e.g. "we deliver
# to 4.2 million households worldwide" on an Amsterdam-based listing).
_PAGE_NON_NL_SIGNALS = frozenset({
    "united states", "usa", "u.s.", "united kingdom", "germany", "deutschland",
    "france", "españa", "spain", "italy", "poland",
    "new york", "california", "texas", "florida", "san francisco", "los angeles",
    "chicago", "seattle", "austin",
})

PROFILES = [
    {"keywords": "Marketing Manager", "location": "Amsterdam",
     "profile": {"naam": "Sarah de Vries", "functietitel": "Marketing Manager", "woonplaats": "Amsterdam"}},
    {"keywords": "Junior Developer", "location": "Utrecht",
     "profile": {"naam": "Daan Bakker", "functietitel": "Junior Developer", "woonplaats": "Utrecht"}},
    {"keywords": "Logistiek medewerker", "location": "Rotterdam",
     "profile": {"naam": "Mehmet Yilmaz", "functietitel": "Logistiek medewerker", "woonplaats": "Rotterdam"}},
]

_STOPWORDS = {"de", "het", "een", "en", "bij", "in", "voor", "van", "op", "met", "the", "at", "for", "a", "an"}


def _title_tokens(title: str) -> set[str]:
    return {t for t in re.sub(r"[^\w\s]", " ", title.lower()).split() if len(t) > 2 and t not in _STOPWORDS}


async def check_job(client: httpx.AsyncClient, job: dict) -> dict:
    result = {"title": job["title"], "company": job["company"], "location": job["location"], "url": job["url"]}

    if not _is_nl_location(job.get("location")):
        result["geo"] = f"FAIL (claimed location '{job['location']}' looks non-NL)"
    else:
        result["geo"] = "ok"

    try:
        r = await client.get(job["url"], follow_redirects=True, timeout=15, headers=_URL_CHECK_HEADERS)
        if "just a moment" in r.text[:2000].lower() and "cloudflare" in r.headers.get("server", "").lower():
            result["alive"] = "BLOCKED (Cloudflare bot-check — not verifiable headlessly, likely fine in a real browser)"
            result["content_match"] = "skipped"
            result["page_geo"] = "skipped"
            return result
        if r.status_code >= 400:
            result["alive"] = f"FAIL (HTTP {r.status_code})"
            result["content_match"] = "skipped"
            result["page_geo"] = "skipped"
            return result
        if "expired_jd_redirect" in str(r.url):
            result["alive"] = "FAIL (LinkedIn expired-listing redirect)"
            result["content_match"] = "skipped"
            result["page_geo"] = "skipped"
            return result
        result["alive"] = "ok"
        page_text = r.text[:20000]
        page_lower = page_text.lower()

        # Content-match: does the fetched page actually mention this job title?
        expected = _title_tokens(job["title"])
        overlap = sum(1 for t in expected if t in page_lower)
        pct = overlap / max(len(expected), 1)
        result["content_match"] = "ok" if pct >= 0.5 else f"FAIL (only {overlap}/{len(expected)} title words found on page)"

        # Page-level geography sanity check — catches cases where the *claimed*
        # location field was NL-looking but the actual listing is abroad.
        hit = next((frag for frag in _PAGE_NON_NL_SIGNALS if frag in page_lower), None)
        result["page_geo"] = f"FAIL (page mentions '{hit}')" if hit else "ok"
    except Exception as exc:
        result["alive"] = f"FAIL ({type(exc).__name__}: {exc})"
        result["content_match"] = "skipped"
        result["page_geo"] = "skipped"

    return result


async def run_once():
    all_jobs = []
    for p in PROFILES:
        jobs = await llm_search_jobs(p["profile"], p["keywords"], p["location"], limit=5)
        all_jobs.extend(jobs)

    async with httpx.AsyncClient() as client:
        results = await asyncio.gather(*[check_job(client, j) for j in all_jobs])
    return results


async def main():
    n_runs = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    all_results = []
    for i in range(1, n_runs + 1):
        print(f"\n=== Run {i}/{n_runs} ===")
        results = await run_once()
        all_results.extend(results)
        for r in results:
            flags = [f"{k}={v}" for k, v in r.items() if k in ("geo", "alive", "content_match", "page_geo") and v != "ok"]
            marker = "FAIL" if flags else "ok"
            print(f"  [{marker}] {r['title']!r} @ {r['company']!r} ({r['location']}) {' | '.join(flags)}")
            print(f"        {r['url'][:90]}")

    total = len(all_results)
    blocked = sum(1 for r in all_results if r["alive"].startswith("BLOCKED"))
    dead = sum(1 for r in all_results if r["alive"] not in ("ok",) and not r["alive"].startswith("BLOCKED"))
    mismatch = sum(1 for r in all_results if r["content_match"] not in ("ok", "skipped"))
    non_nl_claimed = sum(1 for r in all_results if r["geo"] != "ok")
    non_nl_page = sum(1 for r in all_results if r["page_geo"] not in ("ok", "skipped"))

    print(f"\n--- {n_runs} run(s), {total} jobs checked ---")
    print(f"genuinely dead/unreachable links: {dead}/{total}")
    print(f"blocked by bot-detection (unverifiable headlessly, not counted as dead): {blocked}/{total}")
    print(f"title not found on destination page (possible mismatch): {mismatch}/{total}")
    print(f"claimed location looks non-NL: {non_nl_claimed}/{total}")
    print(f"destination page mentions non-NL location: {non_nl_page}/{total}")


if __name__ == "__main__":
    asyncio.run(main())
