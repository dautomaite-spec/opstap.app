"""
In-memory rate limiting for LLM-backed endpoints and IP flood protection.

Limits reset at midnight UTC. The in-memory store is sufficient for a
single-server MVP deployment. If the service is later scaled horizontally,
move counters to Redis or Supabase.
"""
from collections import defaultdict
from datetime import datetime, timezone, date, timedelta
from threading import Lock

_lock = Lock()

# ── Per-user letter generation state ──────────────────────────────────────────
# {user_id: {"date": date, "daily_count": int, "per_job": {job_id: int}}}
_letter_usage: dict = defaultdict(lambda: {"date": None, "daily_count": 0, "per_job": {}})

# ── IP flood protection ────────────────────────────────────────────────────────
# {ip: [timestamp, ...]}  — sliding window of request timestamps
_ip_requests: dict = defaultdict(list)

# Limits
LETTER_DAILY_LIMIT = 10      # total letter generations per user per day
LETTER_PER_JOB_LIMIT = 5    # regenerations for the same job (style changes count)
APPLY_DAILY_LIMIT = 20       # applications sent per user per day (enforced via DB)
IP_WINDOW_SECONDS = 60       # sliding window length
IP_MAX_REQUESTS = 10         # max send requests per IP per window


def _today() -> date:
    return datetime.now(timezone.utc).date()


def check_ip_flood(ip: str) -> bool:
    """
    Returns True (= blocked) if this IP has exceeded IP_MAX_REQUESTS
    within the last IP_WINDOW_SECONDS. Cleans up old timestamps on each call.
    """
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(seconds=IP_WINDOW_SECONDS)
    with _lock:
        timestamps = _ip_requests[ip]
        # Drop timestamps outside the window
        _ip_requests[ip] = [t for t in timestamps if t > cutoff]
        if len(_ip_requests[ip]) >= IP_MAX_REQUESTS:
            return True
        _ip_requests[ip].append(now)
        return False


def check_and_increment_letter(user_id: str, job_id: str) -> tuple[bool, str]:
    """
    Returns (allowed, reason_nl).
    Increments both daily and per-job counters when the request is allowed.
    """
    today = _today()
    with _lock:
        usage = _letter_usage[user_id]

        # Reset counters on a new day
        if usage["date"] != today:
            usage["date"] = today
            usage["daily_count"] = 0
            usage["per_job"] = {}

        if usage["daily_count"] >= LETTER_DAILY_LIMIT:
            return (
                False,
                f"Je hebt het dagelijks limiet van {LETTER_DAILY_LIMIT} brieven bereikt. "
                "Probeer morgen opnieuw.",
            )

        per_job_count = usage["per_job"].get(job_id, 0)
        if per_job_count >= LETTER_PER_JOB_LIMIT:
            return (
                False,
                f"Je hebt deze brief al {LETTER_PER_JOB_LIMIT}x opnieuw gegenereerd. "
                "Gebruik de huidige versie of pas hem handmatig aan.",
            )

        usage["daily_count"] += 1
        usage["per_job"][job_id] = per_job_count + 1
        return True, ""


def get_letter_usage(user_id: str, job_id: str) -> dict:
    """Return remaining quota for display in the UI (optional)."""
    today = _today()
    with _lock:
        usage = _letter_usage[user_id]
        if usage["date"] != today:
            return {
                "daily_remaining": LETTER_DAILY_LIMIT,
                "job_remaining": LETTER_PER_JOB_LIMIT,
            }
        return {
            "daily_remaining": max(0, LETTER_DAILY_LIMIT - usage["daily_count"]),
            "job_remaining": max(0, LETTER_PER_JOB_LIMIT - usage["per_job"].get(job_id, 0)),
        }
