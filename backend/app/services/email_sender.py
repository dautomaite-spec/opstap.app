"""
Email sender service — sends job applications via SendGrid.

Strategy (v1):
  From:     Opstap <sollicitaties@opstap.nl>
  Reply-To: <user's own email>
  To:       <recruiter / company email>

This means replies from the company land directly in the user's inbox.
The user's email is never exposed in the From field.
"""

import html
import logging
from dataclasses import dataclass
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import (
    Mail, From, To, ReplyTo, Subject,
    HtmlContent, PlainTextContent,
)

from app.core.config import settings

logger = logging.getLogger(__name__)


@dataclass
class ApplicationEmail:
    to_email: str           # recruiter / company email
    to_name: str            # company name shown in To field
    reply_to_email: str     # user's personal email — replies go here
    reply_to_name: str      # user's full name
    job_title: str
    company: str
    letter_body: str        # the 3-paragraph body from letter_generator


_FOOTER_PLAIN = """\

---
Deze sollicitatie is verstuurd via Opstap (opstap.nl) — een platform dat werkzoekenden \
helpt met geautomatiseerde sollicitaties in Nederland. De sollicitant is verantwoordelijk \
voor de inhoud. Antwoorden gaan rechtstreeks naar de sollicitant.

Beschouwt u dit als spam of misbruik? Meld het via opstap.nl/misbruik of mail naar \
misbruik@opstap.nl. Wij handelen iedere melding binnen 24 uur af.
"""

_FOOTER_HTML = """\
  <div class="footer">
    <p>
      Deze sollicitatie is verstuurd via <a href="https://opstap.nl">Opstap</a> &mdash;
      een platform dat werkzoekenden helpt met geautomatiseerde sollicitaties in Nederland.
      De sollicitant is verantwoordelijk voor de inhoud van deze brief.
      Antwoorden gaan rechtstreeks naar de sollicitant.
    </p>
    <p>
      Beschouwt u dit als spam of misbruik?
      <a href="https://opstap.nl/misbruik">Meld het hier</a> of mail naar
      <a href="mailto:misbruik@opstap.nl">misbruik@opstap.nl</a>.
      Wij handelen iedere melding binnen 24 uur af.
    </p>
  </div>"""


def _build_plain_text(email: ApplicationEmail) -> str:
    return f"""\
Geachte heer/mevrouw,

{email.letter_body}

Met vriendelijke groet,
{email.reply_to_name}
{email.reply_to_email}
{_FOOTER_PLAIN}"""


def _build_html(email: ApplicationEmail) -> str:
    # Convert paragraphs to <p> tags — escape content to prevent HTML injection
    paragraphs = [p.strip() for p in email.letter_body.split("\n\n") if p.strip()]
    body_html = "\n".join(f"<p>{html.escape(p)}</p>" for p in paragraphs)

    return f"""\
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <style>
    body {{ font-family: Arial, sans-serif; font-size: 15px; color: #1a1a1a; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 24px; }}
    p {{ margin: 0 0 16px; }}
    .greeting {{ margin-bottom: 24px; }}
    .closing {{ margin-top: 24px; }}
    .signature {{ color: #555; font-size: 13px; margin-top: 8px; }}
    .footer {{ margin-top: 40px; padding-top: 16px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #888; }}
  </style>
</head>
<body>
  <p class="greeting">Geachte heer/mevrouw,</p>

  {body_html}

  <div class="closing">
    <p>Met vriendelijke groet,</p>
    <p>
      <strong>{html.escape(email.reply_to_name)}</strong><br>
      <span class="signature">{html.escape(email.reply_to_email)}</span>
    </p>
  </div>

  {_FOOTER_HTML}
</body>
</html>
"""


def _sanitize_header(value: str, max_len: int = 200) -> str:
    """Strip characters that can break email headers and cap length."""
    return value.replace("\r", "").replace("\n", "")[:max_len]


async def send_application_email(email: ApplicationEmail) -> bool:
    """
    Sends the application email via SendGrid.
    Returns True on success, False on failure (logs the error).
    """
    if not settings.sendgrid_api_key:
        logger.warning("SENDGRID_API_KEY not set — skipping email send (dev mode)")
        return True  # don't fail in development

    safe_job_title = _sanitize_header(email.job_title)
    safe_reply_name = _sanitize_header(email.reply_to_name)
    safe_reply_email = _sanitize_header(email.reply_to_email)
    safe_to_name = _sanitize_header(email.to_name)

    subject = f"Sollicitatie: {safe_job_title} — {safe_reply_name}"

    message = Mail(
        from_email=From(settings.sendgrid_from_email, settings.sendgrid_from_name),
        to_emails=To(email.to_email, safe_to_name),
        subject=Subject(subject),
        plain_text_content=PlainTextContent(_build_plain_text(email)),
        html_content=HtmlContent(_build_html(email)),
    )
    message.reply_to = ReplyTo(safe_reply_email, safe_reply_name)

    try:
        sg = SendGridAPIClient(settings.sendgrid_api_key)
        response = sg.send(message)
        logger.info(
            "Email sent to %s for job %r — status %s",
            email.to_email, email.job_title, response.status_code,
        )
        return response.status_code in (200, 201, 202)
    except Exception as exc:
        logger.error("SendGrid send failed: %s", exc)
        return False
