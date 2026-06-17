import asyncio
import ipaddress
import re
import socket
import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from uuid import uuid4
from datetime import datetime, timezone, timedelta
from urllib.parse import urlparse

try:
    from bs4 import BeautifulSoup
    _BS4 = True
except ImportError:
    _BS4 = False

_EMAIL_RE = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')

from app.core.supabase import get_supabase
from app.core.auth import get_current_user_id
from app.core.rate_limiter import (
    check_and_increment_letter,
    get_letter_usage,
    APPLY_DAILY_LIMIT,
    check_ip_flood,
)

APPLY_PER_COMPANY_WEEKLY_LIMIT = 1  # max 1 application per company per user per 7 days
from app.schemas.application import (
    MotivationLetterRequest,
    MotivationLetterOut,
    ApplicationCreate,
    ApplicationOut,
    ApplicationStatusUpdate,
    ApprovalBody,
)
from app.services.letter_generator import generate_letter
from app.services.email_sender import send_application_email, ApplicationEmail
from app.services.prompt_guard import (
    PromptInjectionError,
    sanitize_and_check_profile_text,
    validate_letter_output,
)
from app.services.credits import maybe_award_referrer_credit
from app.services.email_notifications import send_credit_low_warning, send_reply_congratulations, send_application_confirmation

router = APIRouter(prefix="/apply", tags=["apply"])


@router.post("/letter", response_model=MotivationLetterOut)
async def generate_motivation_letter(
    body: MotivationLetterRequest,
    user_id: str = Depends(get_current_user_id),
    supabase=Depends(get_supabase),
):
    # ── Rate limiting ──────────────────────────────────────────────────────────
    allowed, reason = check_and_increment_letter(user_id, str(body.job_id))
    if not allowed:
        raise HTTPException(status_code=429, detail=reason)

    # Fetch and validate job + profile before debiting — prevents losing a credit on a 404
    job_result = supabase.table("jobs").select("*").eq("id", str(body.job_id)).single().execute()
    if not job_result.data:
        raise HTTPException(status_code=404, detail="Job not found")
    job = job_result.data

    profile_result = (
        supabase.table("profiles")
        .select("*")
        .eq("id", str(body.profile_id))
        .eq("user_id", user_id)          # ownership check — prevents cross-user data access
        .single()
        .execute()
    )
    if not profile_result.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    profile = profile_result.data

    # ── Credit check (atomic debit — 402 if insufficient) ─────────────────────
    debit_result = supabase.rpc("debit_one_credit", {
        "p_user_id": user_id,
        "p_reference": str(body.job_id),
    }).execute()
    if debit_result.data is False:
        raise HTTPException(
            status_code=402,
            detail="Onvoldoende credits. Koop credits om verder te gaan.",
        )

    # Send credit-low warning when balance drops to 1 — fire-and-forget, deduped per month
    try:
        bal_result = supabase.table("profiles").select("credits_balance").eq("user_id", user_id).single().execute()
        if bal_result.data and bal_result.data.get("credits_balance") == 1:
            from datetime import date
            month_key = date.today().strftime("%Y-%m")
            insert_result = supabase.table("notifications").insert({
                "user_id": user_id,
                "type": "credit_low",
                "reference_id": month_key,
            }).execute()
            if insert_result.data:
                auth_user = supabase.auth.admin.get_user_by_id(user_id)
                user_email = auth_user.user.email if auth_user.user else None
                if user_email:
                    await send_credit_low_warning(user_email, profile.get("naam", ""), 1)
    except Exception:
        pass  # never block the letter on notification failure

    if body.custom_notes:
        # Injection-check custom_notes before merging into the profile that
        # flows into the Claude prompt.  URLs are not expected in personal notes.
        try:
            sanitize_and_check_profile_text(body.custom_notes, "custom_notes", 500)
        except PromptInjectionError:
            raise HTTPException(
                status_code=422,
                detail=(
                    "Ongeldige invoer in 'Persoonlijke notities'. "
                    "Verwijder eventuele instructies, links of HTML en probeer opnieuw."
                ),
            )
        profile = {**profile, "extra_info": f"{profile.get('extra_info', '')}\n{body.custom_notes}".strip()}

    try:
        letter = await generate_letter(
            job_title=job["title"],
            company=job["company"],
            job_description=job.get("description_snippet") or "",
            profile=profile,
            writing_style=body.writing_style or "formeel",
        )
    except PromptInjectionError:
        raise HTTPException(
            status_code=422,
            detail=(
                "De ingevoerde gegevens bevatten inhoud die niet verwerkt kan worden. "
                "Controleer de vacature- en profielgegevens en probeer opnieuw."
            ),
        )

    # Award referrer credit on the referee's first ever letter (fire-and-forget)
    try:
        await maybe_award_referrer_credit(user_id, supabase)
    except Exception:
        pass

    # Create or update a server-side draft — this is the approval gate anchor.
    # The frontend must reference this application_id when calling /approve.
    # Without the draft in the DB, /approve will 404 — it cannot be bypassed.
    now_str = datetime.now(timezone.utc).isoformat()
    try:
        existing = (
            supabase.table("applications")
            .select("id")
            .eq("user_id", user_id)
            .eq("job_id", str(body.job_id))
            .eq("status", "draft")
            .maybe_single()
            .execute()
        )
        if existing.data:
            supabase.table("applications").update({"letter_nl": letter}).eq("id", existing.data["id"]).execute()
            draft_id = existing.data["id"]
        else:
            insert = supabase.table("applications").insert({
                "id": str(uuid4()),
                "job_id": str(body.job_id),
                "user_id": user_id,
                "company": job["company"],
                "job_title": job["title"],
                "letter_nl": letter,
                "status": "draft",
                "created_at": now_str,
            }).execute()
            if not insert.data:
                raise ValueError("insert returned no data")
            draft_id = insert.data[0]["id"]
    except Exception:
        raise HTTPException(status_code=500, detail="Kon concept niet aanmaken. Probeer opnieuw.")

    quota = get_letter_usage(user_id, str(body.job_id))
    return MotivationLetterOut(
        job_id=body.job_id,
        application_id=draft_id,
        letter_nl=letter,
        generated_at=datetime.now(timezone.utc),
        regenerations_remaining=quota["job_remaining"],
    )


# ── Approval gate — the only server-side path to actually send ────────────────

@router.post("/{application_id}/approve", response_model=ApplicationOut)
async def approve_and_send(
    request: Request,
    application_id: str,
    body: ApprovalBody,
    user_id: str = Depends(get_current_user_id),
    supabase=Depends(get_supabase),
):
    """
    Approve and send an application that was previously drafted via POST /letter.
    The draft must exist in the DB for this user — cannot be called without it.
    This is the unbypassable server-side approval gate.
    """
    ip = request.client.host if request.client else "unknown"
    if check_ip_flood(ip):
        raise HTTPException(status_code=429, detail="Te veel verzoeken. Probeer het later opnieuw.")

    # Fetch the draft — ownership + draft-state enforced at DB level
    draft_result = (
        supabase.table("applications")
        .select("*")
        .eq("id", application_id)
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )
    if not draft_result.data:
        raise HTTPException(status_code=404, detail="Sollicitatie niet gevonden")
    draft = draft_result.data
    if draft["status"] != "draft":
        raise HTTPException(status_code=409, detail="Deze sollicitatie is al verstuurd")

    # Daily send limit (excludes drafts)
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    daily_count = (
        supabase.table("applications")
        .select("id", count="exact")
        .eq("user_id", user_id)
        .neq("status", "draft")
        .gte("created_at", today_start.isoformat())
        .execute()
    ).count or 0
    if daily_count >= APPLY_DAILY_LIMIT:
        raise HTTPException(
            status_code=429,
            detail=f"Je hebt het dagelijks limiet van {APPLY_DAILY_LIMIT} sollicitaties bereikt. Probeer morgen opnieuw.",
        )

    # Per-company weekly limit (excludes drafts)
    week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    company_count = (
        supabase.table("applications")
        .select("id", count="exact")
        .eq("user_id", user_id)
        .eq("company", draft["company"])
        .neq("status", "draft")
        .gte("created_at", week_ago)
        .execute()
    ).count or 0
    if company_count >= APPLY_PER_COMPANY_WEEKLY_LIMIT:
        raise HTTPException(
            status_code=429,
            detail=f"Je hebt deze week al gesolliciteerd bij {draft['company']}. Wacht 7 dagen voor een nieuwe poging.",
        )

    profile_result = supabase.table("profiles").select("naam,is_suspended").eq("user_id", user_id).single().execute()
    if not profile_result.data:
        raise HTTPException(status_code=404, detail="Profiel niet gevonden")
    profile = profile_result.data
    if profile.get("is_suspended"):
        raise HTTPException(
            status_code=403,
            detail="Je account is geschorst wegens vermoeden van misbruik. Neem contact op via misbruik@opstap.nl.",
        )

    auth_user = supabase.auth.admin.get_user_by_id(user_id)
    profile["email"] = auth_user.user.email if auth_user.user else ""

    # Use stored server-side letter unless the user made inline edits
    final_letter = body.letter_nl or draft["letter_nl"]
    try:
        validate_letter_output(final_letter)
    except PromptInjectionError:
        raise HTTPException(status_code=422, detail="Ongeldige briefinhoud. Regenereer de brief en probeer opnieuw.")

    now = datetime.now(timezone.utc)
    status = "pending"
    sent_at = None

    if body.send_method == "email":
        contact_email = body.contact_email_override
        if not contact_email:
            job_result = supabase.table("jobs").select("contact_email").eq("id", draft["job_id"]).maybe_single().execute()
            if job_result.data:
                contact_email = job_result.data.get("contact_email")
        if not contact_email or not _EMAIL_RE.match(contact_email):
            raise HTTPException(
                status_code=422,
                detail="Geen geldig e-mailadres beschikbaar. Voer een recruiter e-mailadres in.",
            )
        success = await send_application_email(ApplicationEmail(
            to_email=contact_email,
            to_name=draft["company"],
            reply_to_email=profile.get("email", ""),
            reply_to_name=profile.get("naam", ""),
            job_title=draft["job_title"],
            company=draft["company"],
            letter_body=final_letter,
        ))
        status = "sent" if success else "failed"
        sent_at = now.isoformat() if success else None
        if success and profile.get("email"):
            asyncio.create_task(send_application_confirmation(
                profile["email"], profile.get("naam", ""), draft["job_title"], draft["company"]
            ))

    updated = (
        supabase.table("applications")
        .update({
            "status": status,
            "send_method": body.send_method,
            "letter_nl": final_letter,
            "approved_at": now.isoformat(),
            "sent_at": sent_at,
        })
        .eq("id", application_id)
        .eq("user_id", user_id)
        .select()
        .execute()
    )
    if not updated.data:
        raise HTTPException(status_code=500, detail="Kon sollicitatie niet bijwerken")
    return updated.data[0]


@router.post("/send", response_model=ApplicationOut, status_code=201)
async def send_application(
    request: Request,
    body: ApplicationCreate,
    user_id: str = Depends(get_current_user_id),
    supabase=Depends(get_supabase),
):
    # ── IP flood protection ────────────────────────────────────────────────────
    ip = request.client.host if request.client else "unknown"
    if check_ip_flood(ip):
        raise HTTPException(status_code=429, detail="Te veel verzoeken. Probeer het later opnieuw.")
    # ── Rate limiting: max APPLY_DAILY_LIMIT applications per day ─────────────
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    usage_result = (
        supabase.table("applications")
        .select("id", count="exact")
        .eq("user_id", user_id)
        .gte("created_at", today_start.isoformat())
        .execute()
    )
    daily_count = usage_result.count or 0
    if daily_count >= APPLY_DAILY_LIMIT:
        raise HTTPException(
            status_code=429,
            detail=f"Je hebt het dagelijks limiet van {APPLY_DAILY_LIMIT} sollicitaties bereikt. Probeer morgen opnieuw.",
        )

    job_result = supabase.table("jobs").select("title,company,url,contact_email").eq("id", str(body.job_id)).single().execute()
    if not job_result.data:
        raise HTTPException(status_code=404, detail="Job not found")
    job = job_result.data

    profile_result = supabase.table("profiles").select("naam,is_suspended").eq("user_id", user_id).single().execute()
    if not profile_result.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    profile = profile_result.data

    # Check suspension before making any further API calls
    if profile.get("is_suspended"):
        raise HTTPException(
            status_code=403,
            detail="Je account is geschorst wegens vermoeden van misbruik. Neem contact op via misbruik@opstap.nl.",
        )

    # Get user email from Supabase auth (not stored on profile to avoid duplication)
    auth_user = supabase.auth.admin.get_user_by_id(user_id)
    profile["email"] = auth_user.user.email if auth_user.user else ""

    # ── Per-company weekly limit ───────────────────────────────────────────────
    week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    company_count_result = (
        supabase.table("applications")
        .select("id", count="exact")
        .eq("user_id", user_id)
        .eq("company", job["company"])
        .gte("created_at", week_ago)
        .execute()
    )
    if (company_count_result.count or 0) >= APPLY_PER_COMPANY_WEEKLY_LIMIT:
        raise HTTPException(
            status_code=429,
            detail=f"Je hebt deze week al gesolliciteerd bij {job['company']}. Wacht 7 dagen voor een nieuwe poging.",
        )

    now = datetime.now(timezone.utc)
    status = "pending"
    sent_at = None

    # Validate letter content before send — client could substitute arbitrary text
    try:
        validate_letter_output(body.letter_nl)
    except PromptInjectionError:
        raise HTTPException(status_code=422, detail="Ongeldige briefinhoud. Regenereer de brief en probeer opnieuw.")

    if body.send_method == "email":
        contact_email = body.contact_email_override or job.get("contact_email")
        if not contact_email or not _EMAIL_RE.match(contact_email):
            raise HTTPException(
                status_code=422,
                detail="Geen geldig e-mailadres beschikbaar. Voer een recruiter e-mailadres in.",
            )

        success = await send_application_email(ApplicationEmail(
            to_email=contact_email,
            to_name=job["company"],
            reply_to_email=profile.get("email", ""),
            reply_to_name=profile.get("naam", ""),
            job_title=job["title"],
            company=job["company"],
            letter_body=body.letter_nl,
        ))
        status = "sent" if success else "failed"
        sent_at = now.isoformat() if success else None

        if success and profile.get("email"):
            asyncio.create_task(send_application_confirmation(
                profile["email"], profile.get("naam", ""), job["title"], job["company"]
            ))

    row = {
        "id": str(uuid4()),
        "job_id": str(body.job_id),
        "user_id": user_id,
        "company": job["company"],
        "job_title": job["title"],
        "letter_nl": body.letter_nl,
        "send_method": body.send_method,
        "status": status,
        "sent_at": sent_at,
        "created_at": now.isoformat(),
    }
    result = supabase.table("applications").insert(row).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to log application")

    return result.data[0]


@router.get("/history", response_model=list[ApplicationOut])
async def application_history(
    user_id: str = Depends(get_current_user_id),
    supabase=Depends(get_supabase),
):
    result = (
        supabase.table("applications")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


@router.patch("/{application_id}/status", response_model=ApplicationOut)
async def update_application_status(
    application_id: str,
    body: ApplicationStatusUpdate,
    user_id: str = Depends(get_current_user_id),
    supabase=Depends(get_supabase),
):
    app_result = (
        supabase.table("applications")
        .select("*")
        .eq("id", application_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not app_result.data:
        raise HTTPException(status_code=404, detail="Sollicitatie niet gevonden")

    app = app_result.data
    now = datetime.now(timezone.utc)
    update = {"status": body.status}
    if body.status in ("replied", "interview"):
        update["replied_at"] = now.isoformat()

    updated = (
        supabase.table("applications")
        .update(update)
        .eq("id", application_id)
        .eq("user_id", user_id)
        .select()
        .execute()
    )
    if not updated.data:
        raise HTTPException(status_code=500, detail="Status bijwerken mislukt")

    # Congratulations email on first reply mark
    if body.status == "replied":
        try:
            auth_user = supabase.auth.admin.get_user_by_id(user_id)
            user_email = auth_user.user.email if auth_user.user else None
            profile_result = supabase.table("profiles").select("naam").eq("user_id", user_id).single().execute()
            naam = profile_result.data.get("naam", "") if profile_result.data else ""
            if user_email:
                await send_reply_congratulations(user_email, naam, app["company"], app["job_title"])
        except Exception:
            pass

    return updated.data[0]


class LetterRatingBody(BaseModel):
    rating: int  # 1 = thumbs up, -1 = thumbs down

    def model_post_init(self, __context):
        if self.rating not in (1, -1):
            raise ValueError("rating must be 1 or -1")


@router.patch("/{application_id}/rating", status_code=204)
async def rate_letter(
    application_id: str,
    body: LetterRatingBody,
    user_id: str = Depends(get_current_user_id),
    supabase=Depends(get_supabase),
):
    result = (
        supabase.table("applications")
        .update({"letter_rating": body.rating})
        .eq("id", application_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Sollicitatie niet gevonden")


# ── URL → letter ────────────────────────────────────────────────────────────

from app.schemas.application import _WritingStyle  # reuse validated Literal type  # noqa: E402


class UrlLetterRequest(BaseModel):
    url: str
    writing_style: _WritingStyle = "formeel"


class UrlLetterResponse(BaseModel):
    job_title: str
    company: str
    description_snippet: str
    letter: str


_URL_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    "Accept-Language": "nl-NL,nl;q=0.9",
    "Accept": "text/html,application/xhtml+xml",
}

_ALLOWED_SCHEMES = {"http", "https"}


def _is_safe_url(url: str) -> tuple[bool, str]:
    """
    Returns (safe, reason). Blocks:
    - non-HTTP/S schemes
    - missing netloc
    - hostnames that resolve to private/loopback/link-local/reserved IPs (SSRF guard)
    """
    try:
        parsed = urlparse(url)
    except Exception:
        return False, "Ongeldige URL"
    if parsed.scheme not in _ALLOWED_SCHEMES:
        return False, "Ongeldige URL"
    hostname = parsed.hostname
    if not hostname:
        return False, "Ongeldige URL"
    try:
        ip = ipaddress.ip_address(socket.gethostbyname(hostname))
    except Exception:
        return False, "Hostnaam kon niet worden omgezet"
    if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved:
        return False, "Ongeldige URL"
    return True, ""


async def _fetch_job_page(url: str) -> str:
    """Fetch a job page without following redirects. Validates the redirect target if one occurs."""
    async with httpx.AsyncClient(timeout=15, headers=_URL_HEADERS, follow_redirects=False) as client:
        resp = await client.get(url)
        if resp.status_code in (301, 302, 303, 307, 308):
            location = resp.headers.get("location", "")
            safe, _ = _is_safe_url(location)
            if not safe:
                raise ValueError("Redirect naar ongeldige URL")
            resp = await client.get(location)
        resp.raise_for_status()
        return resp.text


@router.post("/from-url", response_model=UrlLetterResponse)
async def letter_from_url(
    body: UrlLetterRequest,
    user_id: str = Depends(get_current_user_id),
    supabase=Depends(get_supabase),
):
    """Fetch a job posting from a URL, extract title/company/description, generate a letter. 1 credit."""
    if not _BS4:
        raise HTTPException(status_code=503, detail="Scraper not available")

    safe, reason = _is_safe_url(body.url)
    if not safe:
        raise HTTPException(status_code=422, detail=reason or "Ongeldige URL")

    parsed = urlparse(body.url)

    profile_result = supabase.table("profiles").select("*").eq("user_id", user_id).single().execute()
    if not profile_result.data:
        raise HTTPException(status_code=400, detail="Profiel ontbreekt")
    profile = profile_result.data

    # Atomic credit debit — 402 if insufficient (same pattern as /letter)
    debit_result = supabase.rpc("debit_one_credit", {
        "p_user_id": user_id,
        "p_reference": f"url:{body.url[:100]}",
    }).execute()
    if debit_result.data is False:
        raise HTTPException(status_code=402, detail="Onvoldoende credits. Koop credits om verder te gaan.")

    # Fetch the job page (no redirect-following — redirect target re-validated above)
    try:
        html = await _fetch_job_page(body.url)
    except Exception:
        # Refund — fetch failure is not the user's fault
        supabase.rpc("adjust_credits", {"p_user_id": user_id, "p_delta": 1, "p_reason": "url_fetch_refund", "p_reference_id": None}).execute()
        raise HTTPException(status_code=422, detail="Vacaturepagina kon niet worden geladen")

    soup = BeautifulSoup(html, "html.parser")

    title = ""
    for sel in ["h1.jobTitle", "h1[class*='title']", "h1", "title"]:
        el = soup.select_one(sel)
        if el:
            title = el.get_text(strip=True)[:200]
            break

    company = ""
    for sel in ["[class*='company']", "[class*='employer']", "[itemprop='name']"]:
        el = soup.select_one(sel)
        if el:
            text = el.get_text(strip=True)[:100]
            if text and text != title:
                company = text
                break
    if not company:
        company = (parsed.hostname or "").lstrip("www.").split(".")[0].capitalize()

    for tag in soup(["script", "style", "nav", "header", "footer"]):
        tag.decompose()
    description = soup.get_text(separator=" ", strip=True)[:2000]

    if not title:
        supabase.rpc("adjust_credits", {"p_user_id": user_id, "p_delta": 1, "p_reason": "url_no_title_refund", "p_reference_id": None}).execute()
        raise HTTPException(status_code=422, detail="Geen functietitel gevonden op de pagina")

    # Generate letter — PromptInjectionError: no refund (malicious input), other errors: refund
    try:
        letter = await generate_letter(
            job_title=title,
            company=company,
            job_description=description,
            profile=profile,
            writing_style=body.writing_style,
        )
    except PromptInjectionError:
        raise HTTPException(status_code=422, detail="De vacaturepagina bevat ongeldige inhoud")
    except Exception as exc:
        supabase.rpc("adjust_credits", {"p_user_id": user_id, "p_delta": 1, "p_reason": "letter_from_url_refund", "p_reference_id": None}).execute()
        raise HTTPException(status_code=500, detail="Briefgeneratie mislukt") from exc

    return {
        "job_title": title,
        "company": company,
        "description_snippet": description[:300],
        "letter": letter,
    }
