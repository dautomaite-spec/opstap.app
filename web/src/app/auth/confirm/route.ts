import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/dashboard'

  const supabase = await createClient()

  // OAuth PKCE flow (Google, Outlook, Meta)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  // Email OTP / magic link flow
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type: type as 'signup' | 'recovery' | 'email', token_hash })
    if (!error) {
      // New signups go to onboarding wizard
      const destination = type === 'signup' ? '/dashboard/welkom' : next
      return NextResponse.redirect(new URL(destination, request.url))
    }
  }

  return NextResponse.redirect(new URL('/login?error=' + encodeURIComponent('Bevestigingslink is ongeldig of verlopen. Vraag een nieuwe aan.'), request.url))
}
