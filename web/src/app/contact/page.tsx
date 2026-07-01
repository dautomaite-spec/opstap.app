import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import PublicShell from '@/app/components/PublicShell'
import ContactForm from './ContactForm'

export const metadata: Metadata = {
  title: 'Contact | Opstap',
  description: 'Neem contact op met Opstap. Voor werkgevers, samenwerkingen of vragen.',
}

export default async function ContactPage() {
  const t = await getTranslations('ContactPage')

  return (
    <PublicShell>
      <div className="max-w-lg mx-auto px-6 py-16 md:py-24 w-full">
        <h1 className="text-4xl font-bold mb-3" style={{ color: 'var(--color-indigo-primary)' }}>
          {t('pageTitle')}
        </h1>
        <p className="text-base mb-10" style={{ color: 'var(--color-text-muted)' }}>
          {t('pageSubtitle')}
        </p>

        <ContactForm />

        <p className="mt-8 text-sm text-center" style={{ color: 'var(--color-text-muted)' }}>
          {t('successBody')}
        </p>
      </div>
    </PublicShell>
  )
}
