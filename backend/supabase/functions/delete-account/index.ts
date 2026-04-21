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

  // 1 — Fetch CV path before any deletion so we can clean up storage.
  const { data: profile } = await admin
    .from('profiles')
    .select('cv_path')
    .eq('user_id', userId)
    .maybeSingle()

  // 2 — Delete CV file from storage first (reversible if auth deletion later fails).
  //     Storage files are NOT cascade-deleted when the auth user is removed.
  if (profile?.cv_path) {
    const { error: storageError } = await admin.storage
      .from('cvs')
      .remove([profile.cv_path])
    if (storageError) {
      console.error('CV storage deletion failed:', storageError.message)
      return new Response(
        JSON.stringify({ error: 'CV deletion failed — account not deleted' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }
  }

  // 3 — Delete auth user (ON DELETE CASCADE removes the profile row).
  //     This is the irreversible step — only reached after PII is confirmed removed.
  const { error: deleteError } = await admin.auth.admin.deleteUser(userId)
  if (deleteError) {
    console.error('deleteUser failed:', deleteError.message)
    return new Response(
      JSON.stringify({ error: 'Account deletion failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }

  return new Response(
    JSON.stringify({ deleted: true }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )
})
