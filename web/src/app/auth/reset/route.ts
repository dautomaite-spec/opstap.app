import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Handles the password reset link from Supabase email
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')

  if (token_hash && type === 'recovery') {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ type: 'recovery', token_hash })
    if (!error) {
      return NextResponse.redirect(new URL('/reset-password', request.url))
    }
  }

  return NextResponse.redirect(new URL('/login?error=' + encodeURIComponent('Resetlink is ongeldig of verlopen. Vraag een nieuwe aan.'), request.url))
}
