"""
Motivation letter generator — uses Claude API to write a personalised
Dutch letter for a given job + user profile.
"""

import anthropic
from app.core.config import settings


_client: anthropic.AsyncAnthropic | None = None


def _get_client() -> anthropic.AsyncAnthropic:
    global _client
    if _client is None:
        _client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
    return _client


_SYSTEM = """\
Je bent een professionele carrièrecoach die motivatiebrieven schrijft in het Nederlands.
Schrijf een persoonlijke, authentieke motivatiebrief op basis van het profiel van de sollicitant en de vacature.
De brief moet:
- In het Nederlands zijn
- 3-4 alinea's lang zijn
- Persoonlijk en specifiek zijn (geen generieke tekst)
- De match tussen het profiel en de vacature benadrukken
- Professioneel maar toegankelijk klinken (geen formeel ambtenarentaal)
- Eindigen met een concrete oproep tot actie
Geef ALLEEN de brief terug, zonder opmaaktekens, zonder aanhef als "Geachte" (die wordt apart toegevoegd).
"""


async def generate_letter(
    *,
    job_title: str,
    company: str,
    job_description: str,
    profile: dict,
) -> str:
    """
    Returns a Dutch motivation letter body (without salutation/closing).
    """
    naam = profile.get("naam", "de sollicitant")
    functie = profile.get("functietitel") or ("open voor alles" if profile.get("open_voor_alles") else "")
    woonplaats = profile.get("woonplaats", "")
    extra = profile.get("extra_info", "")

    user_prompt = f"""
Vacature:
  Functietitel: {job_title}
  Bedrijf: {company}
  Omschrijving: {job_description[:800]}

Sollicitant:
  Naam: {naam}
  Huidige/gewenste functie: {functie}
  Woonplaats: {woonplaats}
  Extra informatie: {extra}

Schrijf nu de motivatiebrief.
"""

    client = _get_client()
    message = await client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=_SYSTEM,
        messages=[{"role": "user", "content": user_prompt}],
    )
    return message.content[0].text.strip()
