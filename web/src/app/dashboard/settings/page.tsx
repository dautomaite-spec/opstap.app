import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SettingsClient from './SettingsClient'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('SettingsPage')
  return { title: t('pageTitle') }
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return <SettingsClient userId={user.id} userEmail={user.email ?? ''} />
}
