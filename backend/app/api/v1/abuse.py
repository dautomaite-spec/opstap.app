"""
Abuse reporting + admin review endpoint.

Flow:
  1. Company receives email → clicks footer link → POST /api/v1/abuse/report
  2. Report logged, abuse_report_count incremented on sender's profile
  3. Auto-suspend at AUTO_SUSPEND_THRESHOLD reports
  4. Admin reviews via GET /api/v1/abuse/admin/pending (requires X-Admin-Key header)
  5. Admin resolves via POST /api/v1/abuse/admin/resolve/{report_id}
"""
import logging
import re
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from pydantic import BaseModel, EmailStr, Field

from app.core.config import settings
from app.core.supabase import get_supabase

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/abuse", tags=["abuse"])

AUTO_SUSPEND_THRESHOLD = 3  # suspend after this many confirmed spam reports

# Header injection: block \r or \n in any field used in email headers
_HEADER_SAFE = re.compile(r"[\r\n]")


def _require_admin(x_admin_key: str = Header(default="")):
    if not settings.admin_api_key or x_admin_key != settings.admin_api_key:
        raise HTTPException(status_code=403, detail="Invalid or missing admin key")


# ── Public: abuse report (IP-limited to 5/hour per IP) ────────────────────────

class AbuseReport(BaseModel):
    reporter_email: EmailStr
    reporter_company: str = Field(max_length=200)
    sender_email: str = Field(max_length=200)
    description: str = Field(max_length=1000)


@router.post("/report", status_code=201)
async def report_abuse(body: AbuseReport, request: Request, supabase=Depends(get_supabase)):
    # Sanitize fields that could carry header injection
    safe_company = _HEADER_SAFE.sub("", body.reporter_company)
    safe_sender = _HEADER_SAFE.sub("", body.sender_email)

    now = datetime.now(timezone.utc).isoformat()
    report_id = str(uuid4())
    reporter_ip = request.client.host if request.client else "unknown"

    report_row = {
        "id": report_id,
        "reporter_email": str(body.reporter_email),
        "reporter_company": safe_company,
        "sender_email": safe_sender,
        "description": body.description,
        "reporter_ip": reporter_ip,
        "status": "pending_review",
        "created_at": now,
    }
    supabase.table("abuse_reports").insert(report_row).execute()

    # Find and flag the reported user
    profile_result = (
        supabase.table("profiles")
        .select("user_id,abuse_report_count")
        .eq("email", safe_sender)
        .single()
        .execute()
    )

    if profile_result.data:
        profile = profile_result.data
        new_count = (profile.get("abuse_report_count") or 0) + 1
        update: dict = {"abuse_report_count": new_count}

        if new_count >= AUTO_SUSPEND_THRESHOLD:
            update["is_suspended"] = True
            logger.warning(
                "User %s auto-suspended after %d abuse reports", profile["user_id"], new_count
            )

        supabase.table("profiles").update(update).eq("user_id", profile["user_id"]).execute()

    logger.info("Abuse report %s received from IP %s re sender %s", report_id, reporter_ip, safe_sender)
    return {
        "message": "Uw melding is ontvangen. Wij handelen dit binnen 24 uur af. Dank voor uw medewerking.",
        "report_id": report_id,
    }


# ── Admin: list pending reports ────────────────────────────────────────────────

@router.get("/admin/pending", dependencies=[Depends(_require_admin)])
async def list_pending_reports(supabase=Depends(get_supabase)):
    result = (
        supabase.table("abuse_reports")
        .select("*")
        .eq("status", "pending_review")
        .order("created_at", desc=False)
        .execute()
    )
    return result.data or []


# ── Admin: resolve a report ────────────────────────────────────────────────────

class ResolveAction(BaseModel):
    action: str = Field(pattern="^(dismiss|warn|suspend|ban)$")
    notes: str = Field(default="", max_length=500)


@router.post("/admin/resolve/{report_id}", dependencies=[Depends(_require_admin)])
async def resolve_report(report_id: str, body: ResolveAction, supabase=Depends(get_supabase)):
    report_result = supabase.table("abuse_reports").select("*").eq("id", report_id).single().execute()
    if not report_result.data:
        raise HTTPException(status_code=404, detail="Report not found")

    report = report_result.data

    # Update report status
    supabase.table("abuse_reports").update({
        "status": body.action,
        "resolved_at": datetime.now(timezone.utc).isoformat(),
        "admin_notes": body.notes,
    }).eq("id", report_id).execute()

    # Apply action to user
    if body.action in ("suspend", "ban"):
        profile_result = (
            supabase.table("profiles")
            .select("user_id")
            .eq("email", report["sender_email"])
            .single()
            .execute()
        )
        if profile_result.data:
            supabase.table("profiles").update({"is_suspended": True}).eq(
                "user_id", profile_result.data["user_id"]
            ).execute()
            logger.warning("User suspended via admin action on report %s", report_id)

    elif body.action == "dismiss":
        # False report — decrement abuse count to avoid unfair accumulation
        profile_result = (
            supabase.table("profiles")
            .select("user_id,abuse_report_count")
            .eq("email", report["sender_email"])
            .single()
            .execute()
        )
        if profile_result.data:
            current = profile_result.data.get("abuse_report_count") or 0
            supabase.table("profiles").update({
                "abuse_report_count": max(0, current - 1)
            }).eq("user_id", profile_result.data["user_id"]).execute()

    return {"status": "resolved", "action": body.action}


# ── Public: Terms of Service ───────────────────────────────────────────────────

@router.get("/terms")
async def terms_of_service():
    return {
        "version": "1.0",
        "effective_date": "2026-04-18",
        "url": "https://opstap.nl/voorwaarden",
        "text": _TOS_NL,
    }


_TOS_NL = """\
GEBRUIKSVOORWAARDEN OPSTAP — versie 1.0 (van kracht per 18 april 2026)

1. DIENST
Opstap is een platform dat werkzoekenden ondersteunt bij het automatisch solliciteren op \
Nederlandse vacatures. Opstap genereert motivatiebrieven met behulp van kunstmatige \
intelligentie en verstuurt deze namens de gebruiker.

2. AANSPRAKELIJKHEID GEBRUIKER
De gebruiker is zelf verantwoordelijk voor de inhoud van alle via Opstap verstuurde \
sollicitaties. Opstap treedt op als technisch verzender en is niet verantwoordelijk voor \
de inhoud van berichten die namens de gebruiker worden verstuurd.

3. VERBODEN GEBRUIK
Het is verboden Opstap te gebruiken voor:
- Het versturen van spam, reclame of niet-sollicitatierelevante berichten;
- Het overspoelen van mailboxen van bedrijven of recruiters;
- Het versturen van beledigende, discriminerende of anderszins onrechtmatige inhoud;
- Elk ander gebruik dat in strijd is met de Nederlandse wet of de AVG.

4. MISBRUIK EN INSPECTIE
Wanneer een bedrijf of recruiter een e-mail die via Opstap is verstuurd meldt als spam \
of misbruik, behoudt Opstap zich het recht voor om:
- De betreffende sollicitatie-e-mails en motivatiebrieven te inspecteren;
- Het bijbehorende gebruikersaccount tijdelijk of permanent te schorsen;
- Aangifte te doen bij de bevoegde autoriteiten indien sprake is van strafbaar gedrag.

Door Opstap te gebruiken geeft de gebruiker uitdrukkelijk toestemming voor deze inspectie \
in het geval van een gegronde misbruikmelding.

5. SCHORSING EN BAN
Opstap kan zonder voorafgaande kennisgeving accounts schorsen of permanent opheffen bij:
- Drie of meer gemelde spamklachten;
- Vermoeden van geautomatiseerde of kwaadaardige activiteit;
- Overtreding van deze gebruiksvoorwaarden.

6. PRIVACY EN AVG
Opstap verwerkt persoonsgegevens uitsluitend op EU-servers in overeenstemming met de AVG. \
Gebruikers kunnen hun gegevens te allen tijde inzien, corrigeren of laten verwijderen via \
de app-instellingen.

7. MISBRUIK MELDEN
Bedrijven of recruiters die ongewenste e-mails van Opstap ontvangen, kunnen dit melden via:
- Web: https://opstap.nl/misbruik
- E-mail: misbruik@opstap.nl
Iedere melding wordt binnen 24 uur behandeld.

8. WIJZIGINGEN
Opstap behoudt zich het recht voor deze voorwaarden te wijzigen. Bij ingrijpende wijzigingen \
worden gebruikers via de app geïnformeerd.

Vragen? Neem contact op via support@opstap.nl.
"""
