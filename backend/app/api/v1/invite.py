"""
Invite + waitlist endpoints.

Public (no auth):
  POST /api/v1/invite/waitlist          — join waitlist (email + naam)
  GET  /api/v1/invite/validate/{code}   — check if invite code is valid

Admin (X-Admin-Key):
  POST /api/v1/invite/codes             — generate invite code(s)
  GET  /api/v1/invite/codes             — list all codes with usage + user progress
  GET  /api/v1/invite/waitlist          — list waitlist entries
  POST /api/v1/invite/waitlist/{id}/invite — generate+assign invite code to waitlist entry

Protected (JWT — called on register):
  POST /api/v1/invite/redeem            — redeem invite code after account creation
"""

import secrets
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List

from app.core.config import settings
from app.core.supabase import get_supabase
from app.core.auth import get_current_user_id

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/invite", tags=["invite"])


def _check_admin_key(x_admin_key: Optional[str] = Header(None)):
    import hmac as _hmac
    if not _hmac.compare_digest(x_admin_key or "", settings.admin_api_key):
        raise HTTPException(status_code=403, detail="Forbidden")


def _generate_code() -> str:
    """8-char uppercase alphanumeric, no ambiguous chars (0/O, 1/I/L)."""
    alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
    return "".join(secrets.choice(alphabet) for _ in range(8))


# ── Public endpoints ──────────────────────────────────────────────────────────

class WaitlistJoin(BaseModel):
    email: EmailStr
    naam: Optional[str] = Field(None, max_length=100)


@router.post("/waitlist", status_code=201)
async def join_waitlist(body: WaitlistJoin, supabase=Depends(get_supabase)):
    """Join the beta waitlist. Idempotent — re-submitting the same email is a no-op."""
    try:
        supabase.table("waitlist").upsert(
            {"email": str(body.email).lower(), "naam": body.naam},
            on_conflict="email",
        ).execute()
    except Exception:
        logger.warning("Waitlist insert failed for %s", body.email, exc_info=True)
        raise HTTPException(status_code=500, detail="Aanmelden mislukt. Probeer het opnieuw.")
    return {"message": "Je staat op de lijst! We sturen je een uitnodiging zodra er plek is."}


@router.get("/validate/{code}")
async def validate_code(code: str, supabase=Depends(get_supabase)):
    """Check whether an invite code exists and still has capacity."""
    result = supabase.table("invite_codes").select(
        "id,code,max_uses,use_count,expires_at"
    ).eq("code", code.upper()).maybe_single().execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Ongeldige uitnodigingscode.")

    row = result.data
    if row["use_count"] >= row["max_uses"]:
        raise HTTPException(status_code=410, detail="Deze uitnodigingscode is al volledig gebruikt.")

    if row.get("expires_at"):
        expires = datetime.fromisoformat(row["expires_at"].replace("Z", "+00:00"))
        if expires < datetime.now(timezone.utc):
            raise HTTPException(status_code=410, detail="Deze uitnodigingscode is verlopen.")

    return {"valid": True, "code": row["code"]}


# ── JWT-protected — called after registration ─────────────────────────────────

class RedeemBody(BaseModel):
    code: str = Field(..., min_length=6, max_length=12)


@router.post("/redeem", status_code=200)
async def redeem_code(
    body: RedeemBody,
    user_id: str = Depends(get_current_user_id),
    supabase=Depends(get_supabase),
):
    """Redeem an invite code. Called client-side immediately after registration."""
    code = body.code.strip().upper()

    result = supabase.table("invite_codes").select(
        "id,max_uses,use_count,expires_at"
    ).eq("code", code).maybe_single().execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Ongeldige uitnodigingscode.")

    row = result.data
    if row["use_count"] >= row["max_uses"]:
        raise HTTPException(status_code=410, detail="Deze uitnodigingscode is al volledig gebruikt.")

    if row.get("expires_at"):
        expires = datetime.fromisoformat(row["expires_at"].replace("Z", "+00:00"))
        if expires < datetime.now(timezone.utc):
            raise HTTPException(status_code=410, detail="Deze uitnodigingscode is verlopen.")

    # Record the use (unique constraint on user_id prevents double-redemption)
    try:
        supabase.table("invite_uses").insert({
            "code_id": row["id"],
            "user_id": user_id,
        }).execute()
    except Exception:
        # Unique constraint → already redeemed, silent success
        return {"redeemed": True}

    # Increment use_count
    supabase.table("invite_codes").update(
        {"use_count": row["use_count"] + 1}
    ).eq("id", row["id"]).execute()

    logger.info("Invite code %s redeemed by user %s", code, user_id)
    return {"redeemed": True}


# ── Admin endpoints ───────────────────────────────────────────────────────────

class GenerateCodesBody(BaseModel):
    count: int = Field(1, ge=1, le=50)
    notes: Optional[str] = Field(None, max_length=200)
    max_uses: int = Field(1, ge=1, le=100)


@router.post("/codes", dependencies=[Depends(_check_admin_key)])
async def generate_codes(body: GenerateCodesBody, supabase=Depends(get_supabase)):
    """Generate one or more invite codes."""
    codes = []
    for _ in range(body.count):
        code = _generate_code()
        supabase.table("invite_codes").insert({
            "code": code,
            "notes": body.notes,
            "max_uses": body.max_uses,
        }).execute()
        codes.append(code)
    return {"codes": codes, "count": len(codes)}


@router.get("/codes", dependencies=[Depends(_check_admin_key)])
async def list_codes(supabase=Depends(get_supabase)):
    """List all invite codes with usage and user progress (applied / interview)."""
    codes_result = supabase.table("invite_codes").select(
        "id,code,notes,max_uses,use_count,created_at,expires_at"
    ).order("created_at", desc=True).execute()
    codes = codes_result.data or []

    # Fetch uses with user info
    uses_result = supabase.table("invite_uses").select(
        "code_id,user_id,used_at"
    ).execute()
    uses = uses_result.data or []

    # Get profile data for redeemed users
    user_ids = [u["user_id"] for u in uses]
    profiles_by_uid: dict = {}
    if user_ids:
        profiles_result = supabase.table("profiles").select(
            "user_id,naam,credits_balance,last_active_at"
        ).in_("user_id", user_ids).execute()
        profiles_by_uid = {p["user_id"]: p for p in (profiles_result.data or [])}

    # Get application counts + interview counts per user
    app_counts: dict[str, int] = {}
    interview_counts: dict[str, int] = {}
    if user_ids:
        apps_result = supabase.table("applications").select(
            "user_id,status"
        ).in_("user_id", user_ids).neq("status", "draft").execute()
        for a in (apps_result.data or []):
            uid = a["user_id"]
            app_counts[uid] = app_counts.get(uid, 0) + 1
            if a["status"] == "interview":
                interview_counts[uid] = interview_counts.get(uid, 0) + 1

    # Build code_id → uses map
    uses_by_code: dict[str, list] = {}
    for u in uses:
        cid = u["code_id"]
        p = profiles_by_uid.get(u["user_id"], {})
        uses_by_code.setdefault(cid, []).append({
            "user_id": u["user_id"],
            "naam": p.get("naam", "—"),
            "used_at": u["used_at"],
            "applications": app_counts.get(u["user_id"], 0),
            "interviews": interview_counts.get(u["user_id"], 0),
            "last_active_at": p.get("last_active_at"),
        })

    return [
        {
            **c,
            "users": uses_by_code.get(c["id"], []),
            "invite_url": f"https://opstapapp.nl/register?invite={c['code']}",
        }
        for c in codes
    ]


@router.get("/waitlist", dependencies=[Depends(_check_admin_key)])
async def list_waitlist(supabase=Depends(get_supabase)):
    """List all waitlist entries."""
    result = supabase.table("waitlist").select(
        "id,email,naam,created_at,invited_at,invite_code"
    ).order("created_at", desc=False).execute()
    return result.data or []


class InviteWaitlistEntry(BaseModel):
    notes: Optional[str] = Field(None, max_length=200)


@router.post("/waitlist/{entry_id}/invite", dependencies=[Depends(_check_admin_key)])
async def invite_waitlist_entry(
    entry_id: str,
    body: InviteWaitlistEntry,
    supabase=Depends(get_supabase),
):
    """Generate a personal invite code for a waitlist entry and mark them as invited."""
    entry = supabase.table("waitlist").select("id,email,invited_at").eq(
        "id", entry_id
    ).maybe_single().execute()

    if not entry.data:
        raise HTTPException(status_code=404, detail="Waitlist entry not found")

    if entry.data.get("invited_at"):
        raise HTTPException(status_code=409, detail="Already invited")

    code = _generate_code()
    supabase.table("invite_codes").insert({
        "code": code,
        "notes": body.notes or f"Waitlist: {entry.data['email']}",
        "max_uses": 1,
    }).execute()

    supabase.table("waitlist").update({
        "invite_code": code,
        "invited_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", entry_id).execute()

    return {
        "code": code,
        "invite_url": f"https://opstapapp.nl/register?invite={code}",
        "email": entry.data["email"],
    }
