// Called daily by pg_cron after opstap_delete_expired_cvs() clears cv_path columns.
// Finds profiles where cv_path was recently nulled but Storage file may still exist.
// Also handles Storage cleanup for the purge-inactive flow.
//
// In practice: pg_cron clears the cv_path column; this function is the
// authoritative place to delete the actual Storage objects.
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
  const secret = req.headers.get('x-cron-secret')
  if (!secretsMatch(secret, Deno.env.get('CRON_SECRET') ?? null)) {
    return new Response('Forbidden', { status: 403 })
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Find CVs that expired (cv_expires_at <= now, cv_path still set).
  // pg_cron runs opstap_delete_expired_cvs() first which clears the columns,
  // so this function is the Storage-side complement — run it right after.
  const { data: expired } = await admin
    .from('profiles')
    .select('id, cv_path')
    .lte('cv_expires_at', new Date().toISOString())
    .not('cv_path', 'is', null)
    .limit(200)

  let deleted = 0
  const paths: string[] = []

  for (const row of expired ?? []) {
    if (row.cv_path) paths.push(row.cv_path)
  }

  if (paths.length > 0) {
    const { data, error } = await admin.storage.from('cvs').remove(paths)
    if (!error) deleted = data?.length ?? 0

    // Clear columns for any we successfully removed.
    await admin
      .from('profiles')
      .update({ cv_path: null, cv_expires_at: null, cv_warning_sent: false })
      .in('cv_path', paths)
  }

  return new Response(
    JSON.stringify({ deleted }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )
})
