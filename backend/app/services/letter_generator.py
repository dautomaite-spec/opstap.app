"""
Motivation letter generator — uses Claude API to write a personalised
Dutch letter for a given job + user profile.

Design principles (based on what actually works for Dutch hiring managers):
- 250–350 words in the body — long enough to show substance, short enough to read
- 3 paragraphs: opener → what you bring → closing
- Written in first person, direct, no filler phrases
- Every sentence must contain something specific from the job OR the profile
- No AI-sounding openers ("Met veel enthousiasme", "Hierbij solliciteer ik")
- No empty closers ("Ik hoop u hiermee voldoende te hebben geïnformeerd")
- Reads like something a real person wrote after actually reading the job posting
- Supports writing styles: formeel / informeel / luchtig / grappig
"""

import re
import anthropic
from app.core.config import settings


_client: anthropic.AsyncAnthropic | None = None


def _get_client() -> anthropic.AsyncAnthropic:
    global _client
    if _client is None:
        _client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
    return _client


# ─── Banned phrases ──────────────────────────────────────────────────────────
_BANNED_PHRASES = """
VERBODEN — gebruik dit NOOIT:
- "met veel enthousiasme"
- "Hierbij solliciteer ik"
- "Ik hoop dat deze brief u goed bereikt"
- "Ik hoop u hiermee voldoende te hebben geïnformeerd"
- "Graag stel ik mijzelf voor"
- "Ik ben een gedreven professional"
- "teamplayer"
- "ik ben leergierig"
- "ik ben stressbestendig"
- "passie voor"
- "Ik sta open voor"
- "In afwachting van uw reactie"
- "Met vriendelijke groet" (afsluiting wordt apart toegevoegd)
- Em-dash (—) — gebruik nooit een em-dash, dit is een AI-signaal
- Dubbele punt aan het einde van een zin gevolgd door een opsomming
- Elke generieke zin die ook in 100 andere brieven kan staan
"""

# ─── Format ──────────────────────────────────────────────────────────────────
_FORMAT = """
STRUCTUUR (3 alinea's, 250–350 woorden totaal):

Alinea 1 — OPENER (2–3 zinnen)
  Begin NIET met "Hierbij solliciteer ik". Begin direct met waarom dit bedrijf of deze rol.
  Noem iets specifieks uit de vacature of het bedrijf. Schrijf alsof je de vacature echt hebt gelezen.

Alinea 2 — WAT JIJ BRENGT (4–5 zinnen)
  Koppel concrete dingen uit het profiel aan wat de vacature vraagt.
  Gebruik feiten: functies, sectoren, vaardigheden, locatie, uren.
  Geen loze beweringen. Elke zin bewijst iets.

Alinea 3 — AFSLUITING (2–3 zinnen)
  Kort, zelfverzekerd. Geen bedelen.
  Vraag concreet om een kennismakingsgesprek.
  Eindig actief, niet passief wachtend.

Geef ALLEEN de drie alinea's terug. Geen aanhef, geen afsluiting, geen opmaaktekens.
"""

# ─── Writing style instructions ──────────────────────────────────────────────
_STYLE_INSTRUCTIONS = {
    "formeel": """
SCHRIJFSTIJL: Formeel
- Gebruik u/uw (niet jij/jouw)
- Volledige zinnen, geen afkortingen
- Zakelijk maar warm — geen koude ambtenarentaal
- Correct en professioneel, maar nog steeds menselijk
""",
    "informeel": """
SCHRIJFSTIJL: Informeel
- Gebruik jij/jouw (niet u/uw)
- Directe, toegankelijke toon
- Kortere zinnen, nuchter Nederlands
- Vriendelijk maar professioneel — geschikt voor startups en informele werkgevers
""",
    "luchtig": """
SCHRIJFSTIJL: Luchtig
- Gebruik jij/jouw
- Energiek en positief, maar niet overdreven
- Mag iets persoonlijker zijn — een klein eigen woordje of observatie is oké
- Geschikt voor creatieve bedrijven, retail, horeca
""",
    "grappig": """
SCHRIJFSTIJL: Grappig / Speels
- Gebruik jij/jouw
- Mag één lichte grap of speelse opmerking bevatten — maar houd het professioneel genoeg
- De humor moet relevant zijn aan de baan of het bedrijf, niet willekeurig
- Geschikt voor creatieve functies, mediabedrijven, trendy merken
- Overdrijf niet: één grappige noot is genoeg
""",
}

# ─── System prompt ────────────────────────────────────────────────────────────
_SYSTEM_BASE = """\
Je schrijft motivatiebrieven in het Nederlands voor Nederlandse werkzoekenden.

Jouw taak: schrijf een motivatiebrief die klinkt als geschreven door een echte persoon \
— niet door een AI, niet door een uitzendbureau, niet door ChatGPT.

Regels:
1. Gebruik ALLEEN informatie uit het profiel en de vacature. Verzin niets.
2. Elke zin moet concreet zijn. Geen abstracte eigenschappen zonder bewijs.
3. Schrijf in de eerste persoon, actieve werkwoordsvorm.
4. Correct en natuurlijk Nederlands — geen ambtenarentaal.
5. De brief moet voelen als: iemand die dit bedrijf en deze vacature kent.

{style}

{banned}

{fmt}
"""


async def generate_letter(
    *,
    job_title: str,
    company: str,
    job_description: str,
    profile: dict,
    writing_style: str = "formeel",
) -> str:
    """
    Returns a Dutch motivation letter body (3 paragraphs, ~300 words).
    Salutation and closing are added separately by the caller.

    writing_style options: formeel | informeel | luchtig | grappig
    """
    style_block = _STYLE_INSTRUCTIONS.get(writing_style, _STYLE_INSTRUCTIONS["formeel"])

    system_prompt = _SYSTEM_BASE.format(
        style=style_block,
        banned=_BANNED_PHRASES,
        fmt=_FORMAT,
    )

    # ── Build profile block ───────────────────────────────────────────────────
    naam = profile.get("naam", "")
    functie = profile.get("functietitel", "")
    open_voor_alles = profile.get("open_voor_alles", False)
    woonplaats = profile.get("woonplaats", "")
    beschikbaarheid = profile.get("beschikbaarheid", "")
    uren = profile.get("uren_per_week")
    werklocatie = profile.get("werklocatie", "")
    salaris_min = profile.get("salaris_min")
    salaris_max = profile.get("salaris_max")
    extra = profile.get("extra_info", "")

    profile_lines = []
    if naam:
        profile_lines.append(f"Naam: {naam}")
    if functie:
        profile_lines.append(f"Gewenste functie: {functie}")
    elif open_voor_alles:
        profile_lines.append("Functiewens: open voor alles / flexibel")
    if woonplaats:
        profile_lines.append(f"Woonplaats: {woonplaats}")
    if beschikbaarheid:
        profile_lines.append(f"Beschikbaarheid: {beschikbaarheid}")
    if uren:
        profile_lines.append(f"Gewenste uren per week: {uren}")
    if werklocatie:
        profile_lines.append(f"Werklocatie voorkeur: {werklocatie}")
    if salaris_min and salaris_max:
        profile_lines.append(f"Salarisverwachting: €{salaris_min:,}–€{salaris_max:,} bruto/maand")
    elif salaris_min:
        profile_lines.append(f"Salarisverwachting: vanaf €{salaris_min:,} bruto/maand")
    if extra:
        profile_lines.append(f"Achtergrond / extra info: {extra}")

    profile_block = "\n".join(profile_lines) if profile_lines else "(geen aanvullende profielinfo)"

    # Strip HTML tags and normalise whitespace from scraped content
    # before inserting into the prompt — prevents RSS-borne prompt injection
    def _sanitise(text: str, max_len: int) -> str:
        text = re.sub(r"<[^>]+>", " ", text)          # strip HTML tags
        text = re.sub(r"\s+", " ", text).strip()       # collapse whitespace
        return text[:max_len]

    user_prompt = f"""
VACATURE
Functietitel: {_sanitise(job_title, 120)}
Bedrijf: {_sanitise(company, 120)}
Vacatureomschrijving:
{_sanitise(job_description, 1500)}

PROFIEL SOLLICITANT
{profile_block}

Schrijf de motivatiebrief nu. Volg de structuur exact. Gebruik alleen bovenstaande informatie.
"""

    client = _get_client()
    message = await client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=900,
        system=system_prompt,
        messages=[{"role": "user", "content": user_prompt}],
    )
    return message.content[0].text.strip()


# ─── Baseline example ─────────────────────────────────────────────────────────
#
# Profile input:
#   Naam: Sander Prins | Functie: Magazijnmedewerker | Rotterdam | Fulltime 40u
#   Extra: 3 jaar orderpicker DHL, rijbewijs B, heftruck certificaat
#
# Vacature: Coolblue — Magazijnmedewerker Rotterdam — style: formeel
#
# Expected output:
#
#   Coolblue trekt me aan vanwege de reputatie die jullie hebben opgebouwd rond
#   betrouwbare levering — iets wat ik van binnenuit ken. Bij DHL heb ik drie jaar
#   lang als orderpicker gewerkt in een distributiecentrum van vergelijkbare omvang,
#   waar snelheid en nauwkeurigheid geen keuze waren maar een vereiste.
#
#   Ik woon in Rotterdam, werk fulltime en ben per direct beschikbaar. Mijn heftruck-
#   certificaat is actueel en ik heb rijbewijs B. Bij DHL verwerkte ik dagelijks
#   gemiddeld 400 orders in een team van 15 mensen.
#
#   Ik kom graag langs voor een kennismakingsgesprek om te laten zien wat ik kan
#   bijdragen aan het Coolblue-magazijn in Rotterdam.
