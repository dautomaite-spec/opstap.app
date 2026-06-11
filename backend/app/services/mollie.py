from datetime import datetime, timezone
from uuid import uuid4

import httpx

from app.core.config import settings

MOLLIE_API_BASE = "https://api.mollie.com/v2"

CREDIT_BUNDLES: dict[str, dict] = {
    "10": {"credits": 10, "amount_eur": "2.99", "amount_cents": 299,  "description": "10 credits - Opstap"},
    "30": {"credits": 30, "amount_eur": "6.99", "amount_cents": 699,  "description": "30 credits - Opstap"},
    "75": {"credits": 75, "amount_eur": "14.99", "amount_cents": 1499, "description": "75 credits - Opstap"},
}


async def create_ideal_payment(user_id: str, bundle_key: str, supabase) -> str:
    bundle = CREDIT_BUNDLES[bundle_key]
    idempotency_key = str(uuid4())

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(
            f"{MOLLIE_API_BASE}/payments",
            json={
                "amount": {"currency": "EUR", "value": bundle["amount_eur"]},
                "description": bundle["description"],
                "method": "ideal",
                "redirectUrl": f"{settings.app_base_url}/dashboard/betaling/terug",
                "webhookUrl": f"{settings.api_base_url}/api/v1/credits/webhook",
                "metadata": {"user_id": user_id, "idempotency_key": idempotency_key},
            },
            headers={
                "Authorization": f"Bearer {settings.mollie_api_key}",
                "Content-Type": "application/json",
            },
        )
        resp.raise_for_status()
        payment = resp.json()

    mollie_id: str = payment["id"]
    checkout_url: str = payment["_links"]["checkout"]["href"]

    supabase.table("mollie_payments").insert({
        "user_id": user_id,
        "mollie_id": mollie_id,
        "amount_cents": bundle["amount_cents"],
        "credits_to_grant": bundle["credits"],
        "status": "open",
        "idempotency_key": idempotency_key,
    }).execute()

    return checkout_url


async def handle_webhook(mollie_id: str, supabase) -> None:
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(
            f"{MOLLIE_API_BASE}/payments/{mollie_id}",
            headers={"Authorization": f"Bearer {settings.mollie_api_key}"},
        )
        resp.raise_for_status()
        payment = resp.json()

    status: str = payment["status"]

    record_result = (
        supabase.table("mollie_payments")
        .select("*")
        .eq("mollie_id", mollie_id)
        .maybe_single()
        .execute()
    )
    if not record_result.data:
        return

    record = record_result.data
    now = datetime.now(timezone.utc).isoformat()

    supabase.table("mollie_payments").update({
        "status": status,
        "updated_at": now,
    }).eq("mollie_id", mollie_id).execute()

    if status == "paid" and not record.get("credits_granted"):
        # Atomic: claim_payment_credits does the CAS + credit grant in a single PG transaction
        supabase.rpc("claim_payment_credits", {
            "p_mollie_id": mollie_id,
            "p_user_id": record["user_id"],
            "p_delta": record["credits_to_grant"],
        }).execute()
