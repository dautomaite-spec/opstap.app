'use server'

const MAX_NAME = 120
const MAX_COMPANY = 120
const MAX_EMAIL = 254
const MAX_MESSAGE = 2000
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function sanitize(str: string): string {
  return str.replace(/[<>]/g, '').replace(/[\r\n]/g, ' ').trim()
}

async function verifyTurnstile(token: string): Promise<boolean> {
  if (!process.env.TURNSTILE_SECRET_KEY && process.env.NODE_ENV === 'production') {
    throw new Error('TURNSTILE_SECRET_KEY not configured')
  }
  const secret = process.env.TURNSTILE_SECRET_KEY ?? '1x0000000000000000000000000000000AA'
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret, response: token }),
  })
  const data = await res.json() as { success: boolean }
  return data.success === true
}

async function sendEmail(naam: string, bedrijf: string, email: string, type: string, onderwerp: string, bericht: string) {
  const apiKey = process.env.SENDGRID_API_KEY
  if (!apiKey) throw new Error('SENDGRID_API_KEY not configured')

  await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: 'info@opstapapp.nl' }] }],
      from: { email: 'noreply@opstapapp.nl', name: 'Opstap Contact' },
      reply_to: { email, name: naam },
      subject: `[${type}] ${onderwerp} — ${naam}`,
      content: [{
        type: 'text/plain',
        value: `Type: ${type}\nOnderwerp: ${onderwerp}\nNaam: ${naam}\nBedrijf: ${bedrijf || 'Niet opgegeven'}\nE-mail: ${email}\n\n${bericht}`,
      }],
    }),
  })
}

export type ContactResult = { ok: true } | { ok: false; error: string }

export async function submitContact(_: ContactResult | null, formData: FormData): Promise<ContactResult> {
  // Honeypot: bots fill this hidden field
  if (formData.get('website')) return { ok: false, error: 'spam' }

  const naam = sanitize((formData.get('naam') as string) ?? '').slice(0, MAX_NAME)
  const bedrijf = sanitize((formData.get('bedrijf') as string) ?? '').slice(0, MAX_COMPANY)
  const email = sanitize((formData.get('email') as string) ?? '').slice(0, MAX_EMAIL)
  const type = sanitize((formData.get('type') as string) ?? '').slice(0, 20)
  const onderwerp = sanitize((formData.get('onderwerp') as string) ?? '').slice(0, 120)
  const bericht = sanitize((formData.get('bericht') as string) ?? '').slice(0, MAX_MESSAGE)
  const captchaToken = (formData.get('cf-turnstile-response') as string) ?? ''

  if (!type || !['gebruiker', 'bedrijf'].includes(type)) return { ok: false, error: 'Selecteer een type.' }
  if (!onderwerp) return { ok: false, error: 'Selecteer een onderwerp.' }
  if (!naam) return { ok: false, error: 'Naam is verplicht.' }
  if (!email || !EMAIL_RE.test(email)) return { ok: false, error: 'Voer een geldig e-mailadres in.' }
  if (!bericht || bericht.length < 10) return { ok: false, error: 'Bericht is te kort.' }

  const captchaOk = await verifyTurnstile(captchaToken)
  if (!captchaOk) return { ok: false, error: 'Captcha verificatie mislukt. Probeer het opnieuw.' }

  try {
    await sendEmail(naam, bedrijf, email, type, onderwerp, bericht)
    return { ok: true }
  } catch {
    return { ok: false, error: 'Verzenden mislukt. Probeer het later opnieuw.' }
  }
}
