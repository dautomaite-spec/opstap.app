"""
JWT authentication dependency.

Extracts the Supabase user ID from the Authorization: Bearer <token> header.
Uses the Supabase service role client to verify the token — no manual JWT parsing needed.
"""

from datetime import datetime, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.supabase import get_supabase

_bearer = HTTPBearer()


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
        # Touch last_active_at for AVG rule 6 (90-day inactivity purge).
        # Fire-and-forget: failure never blocks the request.
        try:
            supabase.table("profiles").update({"last_active_at": datetime.now(timezone.utc).isoformat()}).eq("user_id", user_id).execute()
        except Exception:
            pass
        return user_id
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
