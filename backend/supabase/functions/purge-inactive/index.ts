// Called weekly by Supabase cron (or Supabase scheduled function invocation).
// Processes deletion_queue: deletes auth users for inactive accounts (AVG rule 6).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { timingSafeEqual } from 'https://deno.land/std@0.224.0/crypto/timing_safe_equal.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const enc = new TextEncoder()

function secretsMatch(a: string | null, b: string | null): boolean {
  const ab = enc.encode(a ?? '')
  const bb = enc.encode(b ?? '')
  if (ab.length !== bb.length) return false
  return timingSafeEqual(ab, bb)
}

Deno.serve(async (req: Request) => {
  // Only allow invocation from Supabase internal scheduler (shared secret).
  const secret = req.headers.get('x-cron-secret')
  if (!secretsMatch(secret, Deno.env.get('CRON_SECRET') ?? null)) {
    return new Response('Forbidden', { status: 403 })
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: queue, error } = await admin
    .from('deletion_queue')
    .select('user_id')
    .limit(100)

  if (error) {
    console.error('Failed to read deletion_queue:', error.message)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  let deleted = 0
  let failed = 0

  for (const row of queue ?? []) {
    // Delete CV from storage first.
    const { data: profile } = await admin
      .from('profiles')
      .select('cv_path')
      .eq('user_id', row.user_id)
      .maybeSingle()

    if (profile?.cv_path) {
      await admin.storage.from('cvs').remove([profile.cv_path])
    }

    const { error: delError } = await admin.auth.admin.deleteUser(row.user_id)
    if (delError) {
      console.error(`deleteUser ${row.user_id} failed:`, delError.message)
      failed++
    } else {
      deleted++
    }
  }

  return new Response(
    JSON.stringify({ deleted, failed }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )
})
