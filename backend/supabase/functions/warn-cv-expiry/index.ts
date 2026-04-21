// Runs daily via pg_cron. Sends a warning email to users whose CV expires within 7 days.
// Sets cv_warning_sent = true after sending so each user gets at most one warning per CV.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { timingSafeEqual } from 'https://deno.land/std@0.224.0/crypto/timing_safe_equal.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY')!
const fromEmail = Deno.env.get('SENDGRID_FROM_EMAIL') ?? 'sollicitaties@opstap.nl'
const enc = new TextEncoder()

function secretsMatch(a: string | null, b: string | null): boolean {
  const ab = enc.encode(a ?? '')
  const bb = enc.encode(b ?? '')
  if (ab.length !== bb.length) return false
  return timingSafeEqual(ab, bb)
}

async function sendWarningEmail(toEmail: string, naam: string, daysLeft: number): Promise<boolean> {
  const subject = `Je CV verloopt over ${daysLeft} dag${daysLeft === 1 ? '' : 'en'} — actie vereist`
  const body = `Beste ${naam},\n\nJe CV dat is opgeslagen bij Opstap verloopt over ${daysLeft} dag${daysLeft === 1 ? '' : 'en'}. Daarna wordt het automatisch verwijderd.\n\nWil je je CV langer bewaren? Open de Opstap-app en verleng de bewaartermijn via Instellingen. Je kunt je CV ook op elk moment handmatig verwijderen.\n\nMet vriendelijke groet,\nHet Opstap-team`

  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${sendgridApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: toEmail }] }],
      from: { email: fromEmail, name: 'Opstap' },
      subject,
      content: [{ type: 'text/plain', value: body }],
    }),
  })
  return res.status >= 200 && res.status < 300
}

Deno.serve(async (req: Request) => {
  const secret = req.headers.get('x-cron-secret')
  if (!secretsMatch(secret, Deno.env.get('CRON_SECRET') ?? null)) {
    return new Response('Forbidden', { status: 403 })
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const now = new Date().toISOString()

  // Find CVs expiring in ≤7 days that we haven't warned yet.
  const { data: expiring } = await admin
    .from('profiles')
    .select('user_id, naam, email, cv_expires_at')
    .lte('cv_expires_at', sevenDaysFromNow)
    .gte('cv_expires_at', now)
    .eq('cv_warning_sent', false)
    .not('email', 'is', null)
    .limit(200)

  let sent = 0
  let failed = 0

  for (const row of expiring ?? []) {
    const expiresAt = new Date(row.cv_expires_at)
    const daysLeft = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

    const ok = await sendWarningEmail(row.email, row.naam, Math.max(daysLeft, 0))
    if (ok) {
      await admin.from('profiles').update({ cv_warning_sent: true }).eq('user_id', row.user_id)
      sent++
    } else {
      failed++
    }
  }

  return new Response(
    JSON.stringify({ sent, failed }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )
})
