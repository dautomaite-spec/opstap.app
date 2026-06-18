"""
Email notification service — transactional emails to users (not recruiters).

Sends from: Opstap <info@opstapapp.nl>
Different sender than application emails (sollicitaties@opstap.nl).
"""

import asyncio
import html as _html
import logging
from functools import partial
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, From, To, Subject, HtmlContent, PlainTextContent

from app.core.config import settings

logger = logging.getLogger(__name__)

_FROM_EMAIL = "info@opstapapp.nl"
_FROM_NAME = "Opstap"
_DASHBOARD = "https://opstapapp.nl/dashboard"


def _base_html(title: str, body_html: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <style>
    body {{ font-family: Arial, sans-serif; font-size: 15px; color: #1a1a1a; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 24px; }}
    h2 {{ color: #3d3a8c; margin-top: 0; }}
    .btn {{ display: inline-block; background: #3d3a8c; color: white !important; padding: 10px 22px; border-radius: 8px; text-decoration: none; font-weight: bold; }}
    .card {{ background: #f5f3ff; border-radius: 8px; padding: 12px 16px; margin: 8px 0; }}
    .footer {{ margin-top: 40px; padding-top: 16px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #888; }}
  </style>
</head>
<body>
  {body_html}
  <div class="footer">
    <p>Je ontvangt dit bericht via <a href="https://opstapapp.nl">Opstap</a>.</p>
  </div>
</body>
</html>"""


async def _send(to_email: str, to_name: str, subject: str, plain: str, html: str) -> bool:
    if not settings.sendgrid_api_key:
        logger.warning("SENDGRID_API_KEY not set — notification skipped")
        return False
    try:
        message = Mail(
            from_email=From(_FROM_EMAIL, _FROM_NAME),
            to_emails=To(to_email, to_name or to_email),
            subject=Subject(subject),
            plain_text_content=PlainTextContent(plain),
            html_content=HtmlContent(html),
        )
        sg = SendGridAPIClient(settings.sendgrid_api_key)
        loop = asyncio.get_event_loop()
        resp = await loop.run_in_executor(None, partial(sg.send, message))
        ok = resp.status_code in (200, 201, 202)
        if ok:
            logger.info("Notification '%s' sent to %s", subject, to_email)
        return ok
    except Exception as exc:
        logger.error("Notification email failed to %s: %s", to_email, exc)
        return False


async def send_credit_low_warning(to_email: str, naam: str, balance: int) -> bool:
    subject = "Je hebt nog maar 1 credit over op Opstap"
    plain = f"""\
Hallo {naam},

Je hebt nog {balance} credit over op Opstap. Koop credits om door te blijven solliciteren.

Credits kopen: {_DASHBOARD}

Met vriendelijke groet,
Team Opstap
"""
    _naam = _html.escape(naam)
    html = _base_html("Bijna op!", f"""
<h2>Je hebt nog {balance} credit over</h2>
<p>Hallo {_naam},</p>
<p>Goed bezig met solliciteren! Je hebt nog maar <strong>{balance} credit</strong> over op Opstap.</p>
<p>Credits verlopen nooit — koop ze nu zodat je door kunt gaan.</p>
<p style="margin-top:20px;"><a href="{_DASHBOARD}" class="btn">Credits kopen</a></p>
<p style="margin-top:20px;font-size:13px;color:#555;">Bundels vanaf €2,99 · iDEAL · 1 credit = 1 motivatiebrief</p>
""")
    return await _send(to_email, naam, subject, plain, html)


async def send_reply_congratulations(to_email: str, naam: str, company: str, job_title: str) -> bool:
    subject = f"Antwoord van {company} gelogd!"
    plain = f"""\
Hallo {naam},

Je hebt het antwoord van {company} op je sollicitatie voor {job_title} gemarkeerd als beantwoord.
Gefeliciteerd — goed bezig!

Bekijk je reacties: {_DASHBOARD}/sollicitaties

Veel succes met het vervolg,
Team Opstap
"""
    _naam = _html.escape(naam)
    _company = _html.escape(company)
    _job_title = _html.escape(job_title)
    html = _base_html("Gefeliciteerd!", f"""
<h2>Je hebt een antwoord gelogd!</h2>
<p>Hallo {_naam},</p>
<p>Je hebt het antwoord van <strong>{_company}</strong> op je sollicitatie voor
<strong>{_job_title}</strong> gemarkeerd. Goed bezig!</p>
<p style="margin-top:20px;"><a href="{_DASHBOARD}/sollicitaties" class="btn">Mijn reacties</a></p>
""")
    return await _send(to_email, naam, subject, plain, html)


async def send_follow_up_reminder(to_email: str, naam: str, applications: list[dict]) -> bool:
    count = len(applications)
    s = "s" if count != 1 else ""
    subject = f"Heb je al iets gehoord? {count} open sollicitatie{s}"
    apps_plain = "\n".join(f"- {a['job_title']} bij {a['company']}" for a in applications)
    plain = f"""\
Hallo {naam},

Je hebt {count} sollicitatie{s} staan die al 2 weken geleden verstuurd zijn:

{apps_plain}

Nog niets gehoord? Overweeg een beleefd follow-up bericht!

Bekijk je reacties: {_DASHBOARD}/sollicitaties

Veel succes,
Team Opstap
"""
    _naam = _html.escape(naam)
    cards_html = "".join(
        f'<div class="card"><strong>{_html.escape(a["job_title"])}</strong> · {_html.escape(a["company"])}</div>'
        for a in applications
    )
    html = _base_html("Nog geen antwoord?", f"""
<h2>Heb je al iets gehoord?</h2>
<p>Hallo {_naam},</p>
<p>Je hebt {count} sollicitatie{s} staan die al 2 weken geleden verstuurd zijn:</p>
{cards_html}
<p style="margin-top:16px;">Nog niets gehoord? Een beleefd follow-up bericht kan helpen!</p>
<p style="margin-top:20px;"><a href="{_DASHBOARD}/sollicitaties" class="btn">Bekijk mijn reacties</a></p>
""")
    return await _send(to_email, naam, subject, plain, html)


async def send_credits_adjusted(to_email: str, naam: str, delta: int, reason: str, new_balance: int) -> bool:
    positive = delta > 0
    subject = f"Je hebt {'+' if positive else ''}{delta} credits ontvangen" if positive else f"Je credits zijn aangepast ({delta})"
    verb = "ontvangen" if positive else "afgeschreven"
    _naam = _html.escape(naam)
    _reason = _html.escape(reason.replace("_", " "))
    plain = f"""\
Hallo {naam},

Er zijn {'+' if positive else ''}{delta} credits {verb} op je Opstap-account.
Reden: {reason.replace('_', ' ')}
Nieuw saldo: {new_balance} credits

Bekijk je saldo: {_DASHBOARD}

Met vriendelijke groet,
Team Opstap
"""
    html = _base_html("Credits bijgewerkt", f"""
<h2>Je credits zijn bijgewerkt</h2>
<p>Hallo {_naam},</p>
<p>Er zijn <strong>{'+' if positive else ''}{delta} credits</strong> {verb} op je account.</p>
<div class="card">Reden: {_reason}<br>Nieuw saldo: <strong>{new_balance} credits</strong></div>
<p style="margin-top:20px;"><a href="{_DASHBOARD}" class="btn">Naar mijn dashboard</a></p>
""")
    return await _send(to_email, naam, subject, plain, html)


async def send_account_suspended(to_email: str, naam: str, suspended: bool) -> bool:
    if suspended:
        subject = "Je Opstap-account is tijdelijk geblokkeerd"
        _naam = _html.escape(naam)
        plain = f"""\
Hallo {naam},

Je Opstap-account is tijdelijk geblokkeerd. Je kunt op dit moment niet inloggen of solliciteren.

Heb je vragen? Neem contact op via info@opstapapp.nl.

Met vriendelijke groet,
Team Opstap
"""
        html = _base_html("Account geblokkeerd", f"""
<h2>Je account is tijdelijk geblokkeerd</h2>
<p>Hallo {_naam},</p>
<p>Je Opstap-account is tijdelijk geblokkeerd. Je kunt op dit moment niet inloggen of solliciteren.</p>
<p>Heb je vragen of denk je dat dit een vergissing is? Stuur een e-mail naar <a href="mailto:info@opstapapp.nl">info@opstapapp.nl</a>.</p>
""")
    else:
        subject = "Je Opstap-account is hersteld"
        _naam = _html.escape(naam)
        plain = f"""\
Hallo {naam},

Je Opstap-account is hersteld. Je kunt weer normaal inloggen en solliciteren.

Inloggen: https://opstapapp.nl/login

Met vriendelijke groet,
Team Opstap
"""
        html = _base_html("Account hersteld", f"""
<h2>Je account is hersteld</h2>
<p>Hallo {_naam},</p>
<p>Je Opstap-account is hersteld. Je kunt weer normaal inloggen en solliciteren.</p>
<p style="margin-top:20px;"><a href="https://opstapapp.nl/login" class="btn">Inloggen</a></p>
""")
    return await _send(to_email, naam, subject, plain, html)


async def send_application_confirmation(to_email: str, naam: str, job_title: str, company: str) -> bool:
    subject = f"Je sollicitatie bij {company} is verstuurd"
    _naam = _html.escape(naam)
    _job_title = _html.escape(job_title)
    _company = _html.escape(company)
    plain = f"""\
Hallo {naam},

Je sollicitatie voor {job_title} bij {company} is zojuist verstuurd via Opstap.

We houden je op de hoogte! Zodra je een antwoord markeert, sturen we je meteen een berichtje.

Bekijk je sollicitaties: {_DASHBOARD}/sollicitaties

Veel succes,
Team Opstap
"""
    html = _base_html("Sollicitatie verstuurd!", f"""
<h2>Je sollicitatie is verstuurd 🎉</h2>
<p>Hallo {_naam},</p>
<p>Je motivatiebrief voor <strong>{_job_title}</strong> bij <strong>{_company}</strong> is zojuist verstuurd.</p>
<div class="card">Houd je inbox in de gaten voor een reactie van de werkgever.</div>
<p style="margin-top:20px;"><a href="{_DASHBOARD}/sollicitaties" class="btn">Bekijk mijn sollicitaties</a></p>
""")
    return await _send(to_email, naam, subject, plain, html)


async def send_interview_congratulations(to_email: str, naam: str, company: str, job_title: str) -> bool:
    subject = f"Gesprek ingepland bij {company}!"
    _naam = _html.escape(naam)
    _company = _html.escape(company)
    _job_title = _html.escape(job_title)
    plain = f"""\
Hallo {naam},

Gefeliciteerd — je hebt een gesprek bij {company} voor {job_title}!

Bekijk je sollicitaties: {_DASHBOARD}/sollicitaties

Veel succes met het gesprek,
Team Opstap
"""
    html = _base_html("Gesprek ingepland!", f"""
<h2>Gefeliciteerd, je hebt een gesprek!</h2>
<p>Hallo {_naam},</p>
<p>Je hebt een gesprek bij <strong>{_company}</strong> voor <strong>{_job_title}</strong>. Goed bezig!</p>
<p style="margin-top:20px;"><a href="{_DASHBOARD}/sollicitaties" class="btn">Bekijk mijn sollicitaties</a></p>
""")
    return await _send(to_email, naam, subject, plain, html)


async def send_cv_expiry_warning(to_email: str, naam: str, days_remaining: int) -> bool:
    subject = f"Je CV wordt over {days_remaining} dagen verwijderd"
    _naam = _html.escape(naam)
    plain = f"""\
Hallo {naam},

Je opgeslagen CV op Opstap wordt over {days_remaining} dagen automatisch verwijderd op grond van je privacyinstellingen.

Wil je je CV langer bewaren? Verleng de bewaartermijn via je instellingen.

Instellingen: {_DASHBOARD}/settings

Met vriendelijke groet,
Team Opstap
"""
    html = _base_html("CV wordt binnenkort verwijderd", f"""
<h2>Je CV wordt over {days_remaining} dagen verwijderd</h2>
<p>Hallo {_naam},</p>
<p>Je opgeslagen CV op Opstap wordt over <strong>{days_remaining} dagen</strong> automatisch verwijderd
op grond van je privacyinstellingen (AVG).</p>
<p>Wil je je CV langer bewaren? Verleng de bewaartermijn via je instellingen.</p>
<p style="margin-top:20px;"><a href="{_DASHBOARD}/settings" class="btn">Naar instellingen</a></p>
<p style="font-size:13px;color:#555;margin-top:16px;">Je kunt je CV ook op elk moment handmatig verwijderen via de instellingenpagina.</p>
""")
    return await _send(to_email, naam, subject, plain, html)


async def send_job_digest(to_email: str, naam: str, jobs: list[dict]) -> bool:
    count = len(jobs)
    subject = f"{count} nieuwe vacatures voor jou — weekoverzicht Opstap"
    jobs_plain = "\n".join(
        f"- {j['title']} bij {j['company']} ({j.get('location', 'Nederland')})\n  {j.get('url', '')}"
        for j in jobs
    )
    plain = f"""\
Hallo {naam},

Deze week zijn er {count} nieuwe vacatures die bij jouw profiel passen:

{jobs_plain}

Bekijk en solliciteer via je dashboard:
{_DASHBOARD}

Veel succes,
Team Opstap
"""
    _naam = _html.escape(naam)
    cards_html = "".join(f"""
<div class="card">
  <strong>{_html.escape(j['title'])}</strong> · {_html.escape(j['company'])}<br>
  <span style="font-size:13px;color:#555;">{_html.escape(j.get('location','Nederland'))}{' · ' + _html.escape(j['salary_range']) if j.get('salary_range') else ''}</span><br>
  <a href="{_html.escape(j.get('url', _DASHBOARD))}" style="font-size:13px;color:#3d3a8c;">Bekijk vacature →</a>
</div>""" for j in jobs)
    html = _base_html("Weekoverzicht vacatures", f"""
<h2>{count} nieuwe vacatures voor jou</h2>
<p>Hallo {_naam},</p>
<p>Deze week zijn er nieuwe vacatures gevonden die bij jouw profiel passen:</p>
{cards_html}
<p style="margin-top:20px;"><a href="{_DASHBOARD}" class="btn">Bekijk alle vacatures</a></p>
""")
    return await _send(to_email, naam, subject, plain, html)
