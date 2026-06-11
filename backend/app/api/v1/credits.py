import hashlib
import hmac
import logging

from fastapi import APIRouter, Depends, HTTPException, Request
import httpx

logger = logging.getLogger(__name__)

from app.core.supabase import get_supabase
from app.core.auth import get_current_user_id
from app.core.config import settings
from app.schemas.credits import BalanceOut, PurchaseRequest, PurchaseOut, TransactionOut
from app.services.mollie import create_ideal_payment, handle_webhook

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


@router.post("/purchase", response_model=PurchaseOut, status_code=201)
async def create_purchase(
    body: PurchaseRequest,
    user_id: str = Depends(get_current_user_id),
    supabase=Depends(get_supabase),
):
    if not settings.mollie_api_key:
        raise HTTPException(status_code=503, detail="Betalingen zijn momenteel niet beschikbaar.")
    try:
        checkout_url = await create_ideal_payment(user_id, body.bundle, supabase)
    except (httpx.HTTPStatusError, httpx.RequestError):
        raise HTTPException(status_code=502, detail="Betaling aanmaken mislukt. Probeer het opnieuw.")
    return PurchaseOut(checkout_url=checkout_url)


@router.post("/webhook")
async def mollie_webhook(
    request: Request,
    supabase=Depends(get_supabase),
):
    # Mollie sends form-encoded { id: "tr_xxx" } — no auth header
    # If MOLLIE_WEBHOOK_SECRET is set, validate HMAC-SHA256 signature
    if settings.mollie_webhook_secret:
        body = await request.body()
        signature = request.headers.get("X-Mollie-Signature", "")
        expected = hmac.new(
            settings.mollie_webhook_secret.encode(),
            body,
            hashlib.sha256,
        ).hexdigest()
        if not hmac.compare_digest(signature, expected):
            logger.warning("Mollie webhook received with invalid signature — ignoring")
            return {"ok": True}  # Silent reject — still 200 to prevent retry storms
        form = await request.form()
    else:
        form = await request.form()

    mollie_id = form.get("id")
    if mollie_id and isinstance(mollie_id, str):
        try:
            await handle_webhook(mollie_id, supabase)
        except Exception:
            logger.exception("Mollie webhook processing failed for id=%s", mollie_id)
    return {"ok": True}
