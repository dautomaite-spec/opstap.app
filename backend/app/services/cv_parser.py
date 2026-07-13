"""
CV parser — extracts structured data from an uploaded PDF or DOCX using Claude.

Design:
- PDF: sent to Claude as a native base64 document (no text extraction library needed)
- DOCX: text extracted from ZIP/XML, then sent as plain text
- Uses claude-haiku for cost efficiency (extraction, not generation)
- Always fire-and-forget — never surfaces failures to the user
- Stores result in profiles.cv_structured (JSONB)
"""

import base64
import io
import json
import re
import zipfile
import logging
import anthropic

from app.core.config import settings

logger = logging.getLogger(__name__)

_client: anthropic.AsyncAnthropic | None = None


def _get_client() -> anthropic.AsyncAnthropic:
    global _client
    if _client is None:
        _client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
    return _client


_SYSTEM = """\
Je ontvangt een CV. Extraheer de informatie en geef het terug als JSON.

Gebruik exact dit schema:
{
  "samenvatting": "Korte professionele samenvatting in 1-2 zinnen op basis van het CV",
  "werkervaring": [
    {"functie": "...", "bedrijf": "...", "periode": "...", "taken": ["...", "..."]}
  ],
  "opleiding": [
    {"graad": "...", "studierichting": "...", "instelling": "...", "jaar": "..."}
  ],
  "vaardigheden": ["...", "..."],
  "talen": ["...", "..."],
  "certificaten": ["...", "..."]
}

Regels:
- Geef ALLEEN de JSON terug, geen uitleg of extra tekst
- Laat velden leeg als de informatie ontbreekt (lege string of lege array)
- Werkervaring: meest recent eerst, max 6 items
- Vaardigheden: concrete skills, geen vage eigenschappen ("teamwork"), max 20
- Talen: inclusief niveau indien vermeld
"""


async def parse_cv_async(content: bytes, content_type: str, user_id: str, supabase) -> None:
    """
    Parse a CV file and store the structured result in profiles.cv_structured.
    Call with asyncio.create_task() — never awaited directly.
    """
    try:
        structured = await _extract(content, content_type)
        if structured:
            supabase.table("profiles").update({
                "cv_structured": structured,
            }).eq("user_id", user_id).execute()
            logger.info("CV parsed and stored for user %s", user_id)
            # CV content feeds the search summary — regenerate now that it's available
            from app.services.search_summary import regenerate_search_summary
            await regenerate_search_summary(user_id, supabase)
    except Exception:
        logger.warning("CV parsing failed for user %s", user_id, exc_info=True)


async def _extract(content: bytes, content_type: str) -> dict | None:
    client = _get_client()

    if content_type == "application/pdf":
        b64 = base64.standard_b64encode(content).decode("utf-8")
        response = await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=1500,
            system=_SYSTEM,
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "document",
                        "source": {
                            "type": "base64",
                            "media_type": "application/pdf",
                            "data": b64,
                        },
                    },
                    {"type": "text", "text": "Extraheer de CV-informatie als JSON."},
                ],
            }],
        )
    else:
        text = _docx_to_text(content)
        if not text.strip():
            return None
        response = await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=1500,
            system=_SYSTEM,
            messages=[{
                "role": "user",
                "content": f"<cv>\n{text[:8000]}\n</cv>\n\nExtraheer de CV-informatie als JSON.",
            }],
        )

    raw = response.content[0].text.strip()
    # Strip markdown fences if the model wrapped the JSON
    raw = re.sub(r'^```(?:json)?\s*', '', raw)
    raw = re.sub(r'\s*```$', '', raw)
    return json.loads(raw)


def _docx_to_text(content: bytes) -> str:
    """Extract plain text from a DOCX file (ZIP of XML files)."""
    try:
        with zipfile.ZipFile(io.BytesIO(content)) as z:
            with z.open("word/document.xml") as f:
                xml = f.read().decode("utf-8", errors="replace")
        text = re.sub(r'<[^>]+>', ' ', xml)
        return re.sub(r'\s+', ' ', text).strip()
    except Exception:
        return ""
