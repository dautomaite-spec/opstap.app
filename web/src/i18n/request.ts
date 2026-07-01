import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'

const LOCALES = ['nl', 'en', 'tr', 'uk', 'pl', 'ro'] as const
type Locale = (typeof LOCALES)[number]

function isValidLocale(v: string | undefined): v is Locale {
  return LOCALES.includes(v as Locale)
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const raw = cookieStore.get('locale')?.value
  const locale: Locale = isValidLocale(raw) ? raw : 'nl'
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
