import uuid


def generate_referral_code() -> str:
    return uuid.uuid4().hex[:12].upper()


async def award_signup_credits(user_id: str, supabase) -> None:
    supabase.rpc("grant_credits", {
        "p_user_id": user_id,
        "p_delta": 5,
        "p_reason": "signup_bonus",
    }).execute()


async def award_referral_signup_credits(referee_user_id: str, ref_code: str, supabase) -> None:
    referrer_result = (
        supabase.table("profiles")
        .select("user_id")
        .eq("referral_code", ref_code)
        .maybe_single()
        .execute()
    )
    if not referrer_result.data:
        return
    referrer_user_id = referrer_result.data["user_id"]

    if referrer_user_id == referee_user_id:
        return

    try:
        supabase.table("referral_uses").insert({
            "referrer_user_id": referrer_user_id,
            "referee_user_id": referee_user_id,
        }).execute()
    except Exception:
        return  # UNIQUE violation = already referred; skip silently

    supabase.rpc("grant_credits", {
        "p_user_id": referee_user_id,
        "p_delta": 3,
        "p_reason": "referral_referee",
        "p_reference": referrer_user_id,
    }).execute()


async def maybe_award_referrer_credit(referee_user_id: str, supabase) -> None:
    cas = (
        supabase.table("referral_uses")
        .update({"referrer_rewarded": True})
        .eq("referee_user_id", referee_user_id)
        .eq("referrer_rewarded", False)
        .execute()
    )
    if not cas.data:
        return

    referrer_user_id = cas.data[0]["referrer_user_id"]
    supabase.rpc("grant_credits", {
        "p_user_id": referrer_user_id,
        "p_delta": 3,
        "p_reason": "referral_referrer",
        "p_reference": referee_user_id,
    }).execute()


async def check_and_award_profile_bonus(user_id: str, profile: dict, supabase) -> None:
    if profile.get("profile_bonus_given"):
        return
    required = ["naam", "functietitel", "woonplaats", "uren_per_week", "werklocatie", "opleidingsniveau"]
    if not all(profile.get(f) for f in required):
        return
    cas = (
        supabase.table("profiles")
        .update({"profile_bonus_given": True})
        .eq("user_id", user_id)
        .eq("profile_bonus_given", False)
        .execute()
    )
    if cas.data:
        supabase.rpc("grant_credits", {
            "p_user_id": user_id,
            "p_delta": 1,
            "p_reason": "profile_complete",
        }).execute()
