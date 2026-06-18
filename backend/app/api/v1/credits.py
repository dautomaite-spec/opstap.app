import logging

from fastapi import APIRouter, Depends, HTTPException

logger = logging.getLogger(__name__)

from app.core.supabase import get_supabase
from app.core.auth import get_current_user_id
from app.schemas.credits import BalanceOut, TransactionOut

router = APIRouter(prefix="/credits", tags=["credits"])


@router.get("/balance", response_model=BalanceOut)
async def get_balance(
    user_id: str = Depends(get_current_user_id),
    supabase=Depends(get_supabase),
):
    result = (
        supabase.table("profiles")
        .select("credits_balance, referral_code")
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return BalanceOut(
        balance=result.data["credits_balance"],
        referral_code=result.data.get("referral_code"),
    )


@router.get("/transactions", response_model=list[TransactionOut])
async def get_transactions(
    user_id: str = Depends(get_current_user_id),
    supabase=Depends(get_supabase),
):
    result = (
        supabase.table("credit_transactions")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(50)
        .execute()
    )
    return result.data or []
