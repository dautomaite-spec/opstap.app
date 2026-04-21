import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  // Verify the caller's JWT to get the user_id being deleted.
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response('Unauthorized', { status: 401 })
  }
  const jwt = authHeader.slice(7)

  // Use an anon client to verify the JWT — only proves who is calling.
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  })
  const { data: { user: caller }, error: authError } = await callerClient.auth.getUser()
  if (authError || !caller) {
    return new Response('Unauthorized', { status: 401 })
  }
  const userId = caller.id

  // Service-role client for privileged operations.
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // 1 — Delete CV file from storage (ignore if already gone).
  const { data: profile } = await admin
    .from('profiles')
    .select('cv_path')
    .eq('user_id', userId)
    .maybeSingle()

  // 2 — Delete auth user first — this is the irreversible anchor.
  //     If it fails, nothing has been deleted yet, so the user can retry.
  //     Cleanup of profile/storage after auth deletion can be handled by background jobs if needed.
  const { error: deleteError } = await admin.auth.admin.deleteUser(userId)
  if (deleteError) {
    console.error('deleteUser failed:', deleteError.message)
    return new Response(
      JSON.stringify({ error: 'Account deletion failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }

  // 3 — Delete CV file from storage (auth.users ON DELETE CASCADE removes profile row,
  //     but Storage files are not cascaded — must be done explicitly).
  if (profile?.cv_path) {
    await admin.storage.from('cvs').remove([profile.cv_path])
  }

  return new Response(
    JSON.stringify({ deleted: true }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )
})
