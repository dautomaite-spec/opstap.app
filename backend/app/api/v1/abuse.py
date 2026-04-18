"""
Abuse reporting endpoint — for companies receiving unwanted application emails.

When a report is received:
- It is logged to the abuse_reports table
- The flagged user's abuse_report_count is incremented
- If count >= AUTO_SUSPEND_THRESHOLD, the user is auto-suspended pending review
"""
import logging
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field

from app.core.supabase import get_supabase

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/abuse", tags=["abuse"])

AUTO_SUSPEND_THRESHOLD = 3  # suspend after 3 confirmed spam reports


class AbuseReport(BaseModel):
    reporter_email: EmailStr
    reporter_company: str = Field(max_length=200)
    sender_email: str = Field(max_length=200)  # the applicant's email (from Reply-To)
    description: str = Field(max_length=1000)


@router.post("/report", status_code=201)
async def report_abuse(body: AbuseReport, supabase=Depends(get_supabase)):
    now = datetime.now(timezone.utc).isoformat()

    report_row = {
        "id": str(uuid4()),
        "reporter_email": body.reporter_email,
        "reporter_company": body.reporter_company,
        "sender_email": body.sender_email,
        "description": body.description,
        "status": "pending_review",
        "created_at": now,
    }
    supabase.table("abuse_reports").insert(report_row).execute()

    # Look up the user by their reply-to email and increment report count
    profile_result = (
        supabase.table("profiles")
        .select("user_id,abuse_report_count")
        .eq("email", body.sender_email)
        .single()
        .execute()
    )

    if profile_result.data:
        profile = profile_result.data
        new_count = (profile.get("abuse_report_count") or 0) + 1
        update = {"abuse_report_count": new_count}

        if new_count >= AUTO_SUSPEND_THRESHOLD:
            update["is_suspended"] = True
            logger.warning(
                "User %s auto-suspended after %d abuse reports",
                profile["user_id"], new_count,
            )

        supabase.table("profiles").update(update).eq("user_id", profile["user_id"]).execute()

    logger.info("Abuse report received from %s re sender %s", body.reporter_email, body.sender_email)
    return {
        "message": "Uw melding is ontvangen. Wij handelen dit binnen 24 uur af. Dank voor uw medewerking.",
        "report_id": report_row["id"],
    }


@router.get("/terms")
async def terms_of_service():
    """Returns the Opstap Terms of Service as plain text."""
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
- Elk ander gebruik dat in strijd is met de Nederlandse wet of de Algemene Verordening \
  Gegevensbescherming (AVG).

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
