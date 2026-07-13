"""
First-strike suspension for deliberate injection attempts.

When prompt-injection patterns are detected in text the user typed directly
(profile free-text fields, custom letter notes), the account is suspended
immediately — one attempt is enough to lose access, so attackers cannot
iterate against the prompt guard. Suspension is reversible by an admin via
POST /admin/users/{user_id}/suspend (see admin.py), which covers the rare
false positive.

Deliberately NOT applied to:
- CV-extracted text (a CV can contain third-party content the user never
  wrote; those fields are silently dropped in search_summary.py instead)
- Scraped job text (the user didn't write it)
- Letter-output validation (benign edits like adding a salary figure trip it)
"""

import logging

logger = logging.getLogger(__name__)

_SUSPENSION_DETAIL = (
    "Je account is geschorst wegens vermoeden van misbruik. "
    "Neem contact op via misbruik@opstap.nl."
)


def suspend_for_injection(user_id: str, field: str, supabase) -> str:
    """Suspend the account after an injection attempt in a user-typed field.
    Returns the Dutch detail message for the HTTP 403 response."""
    try:
        result = supabase.table("profiles").select("abuse_report_count").eq(
            "user_id", user_id
        ).maybe_single().execute()
        current = (result.data or {}).get("abuse_report_count") or 0
        supabase.table("profiles").update({
            "is_suspended": True,
            "abuse_report_count": current + 1,
        }).eq("user_id", user_id).execute()
        logger.warning(
            "First-strike suspension: injection attempt by user %s in field '%s'",
            user_id, field,
        )
    except Exception:
        # Never let the suspension write mask the original 403 to the attacker
        logger.error("Failed to persist suspension for user %s", user_id, exc_info=True)
    return _SUSPENSION_DETAIL
