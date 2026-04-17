"""
Email sender service — sends job applications via SendGrid.

Strategy (v1):
  From:     Opstap <sollicitaties@opstap.nl>
  Reply-To: <user's own email>
  To:       <recruiter / company email>

This means replies from the company land directly in the user's inbox.
The user's email is never exposed in the From field.
"""

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


def _build_plain_text(email: ApplicationEmail) -> str:
    return f"""\
Geachte heer/mevrouw,

{email.letter_body}

Met vriendelijke groet,
{email.reply_to_name}
{email.reply_to_email}
"""


def _build_html(email: ApplicationEmail) -> str:
    # Convert paragraphs to <p> tags
    paragraphs = [p.strip() for p in email.letter_body.split("\n\n") if p.strip()]
    body_html = "\n".join(f"<p>{p}</p>" for p in paragraphs)

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
      <strong>{email.reply_to_name}</strong><br>
      <span class="signature">{email.reply_to_email}</span>
    </p>
  </div>

  <div class="footer">
    Deze sollicitatie is verstuurd via <a href="https://opstap.nl">Opstap</a> &mdash;
    de Nederlandse sollicitatie-assistent. Antwoorden gaan rechtstreeks naar de sollicitant.
  </div>
</body>
</html>
"""


async def send_application_email(email: ApplicationEmail) -> bool:
    """
    Sends the application email via SendGrid.
    Returns True on success, False on failure (logs the error).
    """
    if not settings.sendgrid_api_key:
        logger.warning("SENDGRID_API_KEY not set — skipping email send (dev mode)")
        return True  # don't fail in development

    subject = f"Sollicitatie: {email.job_title} — {email.reply_to_name}"

    message = Mail(
        from_email=From(settings.sendgrid_from_email, settings.sendgrid_from_name),
        to_emails=To(email.to_email, email.to_name),
        subject=Subject(subject),
        plain_text_content=PlainTextContent(_build_plain_text(email)),
        html_content=HtmlContent(_build_html(email)),
    )
    message.reply_to = ReplyTo(email.reply_to_email, email.reply_to_name)

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
