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

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { naam } },
  })
  if (error) {
    redirect(`/register?error=${encodeURIComponent(dutchAuthError(error.message))}`)
  }
  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}
