"""
JWT authentication dependency.

Extracts the Supabase user ID from the Authorization: Bearer <token> header.
Uses the Supabase service role client to verify the token — no manual JWT parsing needed.
"""

import threading
from datetime import datetime, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.supabase import get_supabase

_bearer = HTTPBearer()

# last_active_at only needs minute-level precision for the AVG 90-day purge —
# writing it on EVERY authenticated request added a DB write to the hot path.
_LAST_ACTIVE_THROTTLE_SECONDS = 15 * 60
_last_active_written: dict[str, datetime] = {}
_last_active_lock = threading.Lock()


def _should_touch_last_active(user_id: str, now: datetime) -> bool:
    with _last_active_lock:
        last = _last_active_written.get(user_id)
        if last and (now - last).total_seconds() < _LAST_ACTIVE_THROTTLE_SECONDS:
            return False
        _last_active_written[user_id] = now
        # Evict stale entries so the dict doesn't grow for the process lifetime
        if len(_last_active_written) > 10_000:
            cutoff = [uid for uid, ts in _last_active_written.items()
                      if (now - ts).total_seconds() >= _LAST_ACTIVE_THROTTLE_SECONDS]
            for uid in cutoff:
                del _last_active_written[uid]
        return True


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    supabase=Depends(get_supabase),
) -> str:
    """
    FastAPI dependency — returns the authenticated user's UUID.
    Raises 401 if the token is missing or invalid.
    """
    token = credentials.credentials
    try:
        response = supabase.auth.get_user(token)
        user = response.user
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
            )
        user_id = str(user.id)
        # Touch last_active_at for AVG rule 6 (90-day inactivity purge) —
        # throttled to once per 15 min per user; failure never blocks the request.
        try:
            now = datetime.now(timezone.utc)
            if _should_touch_last_active(user_id, now):
                supabase.table("profiles").update({"last_active_at": now.isoformat()}).eq("user_id", user_id).execute()
        except Exception:
            pass
        return user_id
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
