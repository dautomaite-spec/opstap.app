'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function dutchAuthError(msg: string): string {
  const m = msg.toLowerCase()
  if (m.includes('invalid login credentials') || m.includes('invalid credentials')) return 'E-mailadres of wachtwoord is onjuist.'
  if (m.includes('email not confirmed')) return 'Bevestig eerst je e-mailadres via de link die we je hebben gestuurd.'
  if (m.includes('user already registered') || m.includes('already registered')) return 'Dit e-mailadres is al in gebruik. Probeer in te loggen.'
  if (m.includes('password should be at least')) return 'Je wachtwoord moet minimaal 8 tekens bevatten.'
  if (m.includes('unable to validate email address')) return 'Voer een geldig e-mailadres in.'
  if (m.includes('email rate limit exceeded') || m.includes('too many requests')) return 'Te veel pogingen. Probeer het over een paar minuten opnieuw.'
  return 'Er is iets misgegaan. Probeer het opnieuw.'
}

export async function login(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    redirect(`/login?error=${encodeURIComponent(dutchAuthError(error.message))}`)
  }
  redirect('/dashboard')
}

export async function register(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const naam = formData.get('naam') as string
  const ref = (formData.get('ref') as string | null) || undefined

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { naam, ...(ref ? { ref_code: ref } : {}) },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://opstapapp.nl'}/auth/confirm`,
    },
  })
  if (error) {
    redirect(`/register?error=${encodeURIComponent(dutchAuthError(error.message))}`)
  }
  // If Supabase auto-confirm is off, user.identities will be empty or session null
  if (!data.session) {
    redirect('/register/bevestig')
  }
  redirect('/dashboard')
}

export async function forgotPassword(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://opstapapp.nl'}/auth/reset`,
  })
  // Always redirect to "sent" page — don't reveal whether email exists (enumeration protection)
  redirect('/forgot-password?sent=1')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}
