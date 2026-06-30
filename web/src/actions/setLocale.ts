'use server'
import { cookies } from 'next/headers'

const VALID = ['nl', 'en', 'tr', 'uk', 'pl', 'ro']

export async function setLocale(locale: string) {
  if (!VALID.includes(locale)) return
  const store = await cookies()
  store.set('locale', locale, { path: '/', maxAge: 60 * 60 * 24 * 365 })
}
