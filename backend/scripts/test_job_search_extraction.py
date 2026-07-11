"""
Cheap, direct test of llm_search_jobs() company/location extraction —
no browser, no auth, no vision model. Exercises the exact code path
fixed in llm_job_search.py against 3 profiles and reports pass/fail.

Usage: python scripts/test_job_search_extraction.py
"""

import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.llm_job_search import llm_search_jobs  # noqa: E402

PROFILES = [
    {
        "keywords": "Marketing Manager",
        "location": "Amsterdam",
        "profile": {"naam": "Sarah de Vries", "functietitel": "Marketing Manager", "woonplaats": "Amsterdam"},
    },
    {
        "keywords": "Junior Developer",
        "location": "Utrecht",
        "profile": {"naam": "Daan Bakker", "functietitel": "Junior Developer", "woonplaats": "Utrecht"},
    },
    {
        "keywords": "Logistiek medewerker",
        "location": "Rotterdam",
        "profile": {"naam": "Mehmet Yilmaz", "functietitel": "Logistiek medewerker", "woonplaats": "Rotterdam"},
    },
]


async def run_once(run_no: int):
    total = 0
    unknown_company = 0
    below_bar = 0
    zero_result_queries = 0

    for p in PROFILES:
        jobs = await llm_search_jobs(p["profile"], p["keywords"], p["location"], limit=5)
        if not jobs:
            zero_result_queries += 1
            print(f"  [{p['keywords']}/{p['location']}] 0 results")
            continue
        for j in jobs:
            total += 1
            if j.get("company") == "Onbekend":
                unknown_company += 1
            if j.get("quality_score", 0) < 8:
                below_bar += 1
        avg_q = sum(j.get("quality_score", 0) for j in jobs) / len(jobs)
        print(f"  [{p['keywords']}/{p['location']}] {len(jobs)} jobs, avg quality {avg_q:.1f}/10")

    return {"total": total, "unknown_company": unknown_company, "below_bar": below_bar, "zero_result_queries": zero_result_queries}


async def main():
    n_runs = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    results = []
    for i in range(1, n_runs + 1):
        print(f"\n=== Run {i}/{n_runs} ===")
        results.append(await run_once(i))

    total = sum(r["total"] for r in results)
    unknown_company = sum(r["unknown_company"] for r in results)
    below_bar = sum(r["below_bar"] for r in results)
    zero_result_queries = sum(r["zero_result_queries"] for r in results)
    print(f"\n--- {n_runs} run(s), {total} jobs total ---")
    print(f"company=Onbekend: {unknown_company}/{total}")
    print(f"below 8/10 quality bar (should be filtered, so expect 0): {below_bar}/{total}")
    print(f"queries with zero results: {zero_result_queries}/{n_runs * len(PROFILES)}")


if __name__ == "__main__":
    asyncio.run(main())
