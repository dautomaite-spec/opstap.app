"""
Motivation letter generator — uses Claude API to write a personalised
Dutch letter for a given job + user profile.

Design principles (based on what actually works for Dutch hiring managers):
- 250–350 words in the body — long enough to show substance, short enough to read
- 3 paragraphs: opener → why this job/company → what you bring → next step
- Written in first person, direct, no filler phrases
- Every sentence must contain something specific from the job OR the profile
- No AI-sounding openers ("Met veel enthousiasme", "Hierbij solliciteer ik")
- No empty closers ("Ik hoop u hiermee voldoende te hebben geïnformeerd")
- Reads like something a real person wrote after actually reading the job posting
"""

import anthropic
from app.core.config import settings


_client: anthropic.AsyncAnthropic | None = None


def _get_client() -> anthropic.AsyncAnthropic:
    global _client
    if _client is None:
        _client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
    return _client


# ─── Banned phrases ──────────────────────────────────────────────────────────
# These are injected into the prompt so the model knows exactly what to avoid.
_BANNED_PHRASES = """
VERBODEN zinnen en uitdrukkingen — gebruik deze NOOIT:
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
- "Met vriendelijke groet" (dit voeg je NIET toe — de aanhef/afsluiting wordt los toegevoegd)
- Elk generiek zin die ook in 100 andere brieven kan staan
"""

# ─── Format specification ────────────────────────────────────────────────────
_FORMAT = """
STRUCTUUR (3 alinea's, 250–350 woorden totaal):

Alinea 1 — OPENER (2–3 zinnen)
  Geen "Hierbij solliciteer ik". Begin direct: waarom dit bedrijf, waarom nu.
  Noem iets specifieks uit de vacature of over het bedrijf dat je aantrekt.
  Schrijf vanuit het perspectief van iemand die de vacature echt heeft gelezen.

Alinea 2 — WAT JIJ BRENGT (4–5 zinnen)
  Koppel concrete dingen uit het profiel aan wat de vacature vraagt.
  Gebruik feiten en voorbeelden: functies, sectoren, vaardigheden, locatie.
  Als de persoon "open voor alles" is, benadruk dan flexibiliteit en leervermogen — met bewijs.
  Geen loze beweringen. Elke zin moet iets bewijzen.

Alinea 3 — AFSLUITING (2–3 zinnen)
  Kort, zelfverzekerd. Geen bedelen om een kans.
  Benoem concreet wat je wil: een kennismakingsgesprek.
  Eindig met een actieve zin, niet passief wachten.

Geef ALLEEN de drie alinea's terug. Geen aanhef, geen afsluiting, geen opmaaktekens.
"""

# ─── System prompt ────────────────────────────────────────────────────────────
_SYSTEM = f"""\
Je schrijft motivatiebrieven in het Nederlands voor Nederlandse werkzoekenden.

Jouw taak: schrijf een motivatiebrief die klinkt als geschreven door een echte persoon — \
niet door een AI, niet door een uitzendbureau, niet door ChatGPT.

Regels:
1. Gebruik ALLEEN informatie uit het profiel en de vacature. Verzin niets.
2. Elke zin moet concreet zijn. Geen abstracte eigenschappen zonder bewijs.
3. Schrijf in de eerste persoon, actieve werkwoordsvorm.
4. Het Nederlands moet correct en natuurlijk zijn — geen ambtenarentaal, geen overdreven formeel.
5. De brief moet voelen als: iemand die dit bedrijf en deze vacature kent, en weet wat hij/zij wil.

{_BANNED_PHRASES}

{_FORMAT}
"""


async def generate_letter(
    *,
    job_title: str,
    company: str,
    job_description: str,
    profile: dict,
) -> str:
    """
    Returns a Dutch motivation letter body (3 paragraphs, ~300 words).
    Salutation and closing are added separately by the caller.
    """
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

    # Build a structured profile block — only include fields that have values
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

    user_prompt = f"""
VACATURE
Functietitel: {job_title}
Bedrijf: {company}
Vacatureomschrijving:
{job_description[:1200]}

PROFIEL SOLLICITANT
{profile_block}

Schrijf de motivatiebrief nu. Volg de structuur exact. Gebruik alleen bovenstaande informatie.
"""

    client = _get_client()
    message = await client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=800,
        system=_SYSTEM,
        messages=[{"role": "user", "content": user_prompt}],
    )
    return message.content[0].text.strip()


# ─── Baseline example ─────────────────────────────────────────────────────────
#
# The following shows the format and tone a generated letter should aim for.
# Used as reference during prompt development and QA.
#
# Profile input:
#   Naam: Sander Prins
#   Gewenste functie: Magazijnmedewerker
#   Woonplaats: Rotterdam
#   Beschikbaarheid: fulltime
#   Uren per week: 40
#   Extra info: 3 jaar ervaring als orderpicker bij DHL, rijbewijs B, heftruck certificaat
#
# Vacature:
#   Bedrijf: Coolblue
#   Functie: Magazijnmedewerker — Distributiecentrum Rotterdam
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
#   gemiddeld 400 orders in een team van 15 mensen — ik ken het ritme van een druk
#   distributiecentrum en weet hoe ik mijn werk georganiseerd houd onder tijdsdruk.
#
#   Ik kom graag langs voor een kennismakingsgesprek om te laten zien wat ik kan
#   bijdragen aan het Coolblue-magazijn in Rotterdam. Ik ben bereikbaar via [contactinfo].
