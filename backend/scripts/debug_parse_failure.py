"""Debug the Marketing Manager/Amsterdam JSON parse failures — prints raw Claude output."""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services import llm_job_search as m  # noqa: E402

_orig_loads = m.json.loads


def _debug_loads(raw, *a, **kw):
    try:
        return _orig_loads(raw, *a, **kw)
    except Exception:
        print("----- RAW TEXT THAT FAILED TO PARSE -----")
        print(raw)
        print("----- END RAW (len=%d) -----" % len(raw))
        raise


m.json.loads = _debug_loads

profile = {"naam": "Sarah de Vries", "functietitel": "Marketing Manager", "woonplaats": "Amsterdam"}

for attempt in range(5):
    print(f"\n########## attempt {attempt + 1} ##########")
    jobs = m._run_llm_search(profile, "Marketing Manager", "Amsterdam", 5, "nl")
    print(f"parsed {len(jobs)} jobs")
    if jobs:
        break
