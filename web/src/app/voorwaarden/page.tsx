import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

export const metadata: Metadata = {
  title: 'Algemene voorwaarden | Opstap',
  description: 'Lees de algemene voorwaarden van Opstap.',
  alternates: { canonical: 'https://opstapapp.nl/voorwaarden' },
}

export default async function VoorwaardenPage() {
  const t = await getTranslations('VoorwaardenPage')

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-lavender-bg)' }}>
      <nav className="px-6 py-4 border-b" style={{ background: 'var(--color-white)', borderColor: 'var(--color-lavender-card)' }}>
        <Link href="/" className="font-bold text-lg" style={{ color: 'var(--color-indigo-primary)' }}>
          Opstap
        </Link>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
          {t('pageTitle')}
        </h1>
        <p className="text-sm mb-8" style={{ color: 'var(--color-text-muted)' }}>
          {t('lastModified')}
        </p>

        <Section title={t('section1Title')}>
          {t('section1Body')}
        </Section>

        <Section title={t('section2Title')}>
          {t('section2Body')}
        </Section>

        <Section title={t('section3Title')}>
          {t('section3Body')}
        </Section>

        <Section title={t('section4Title')}>
          {t('section4Body')}
        </Section>

        <Section title={t('section5Title')}>
          {t('section5Body')}
        </Section>

        <Section title={t('section6Title')}>
          {t('section6BodyPrefix')}{' '}
          <Link href="/privacy" className="underline" style={{ color: 'var(--color-indigo-primary)' }}>
            {t('section6PrivacyLink')}
          </Link>
          {t('section6BodySuffix')}
        </Section>

        <Section title={t('section7Title')}>
          {t('section7Body')}
        </Section>

        <Section title={t('section8Title')}>
          {t('section8Body')}
        </Section>

        <Section title={t('section9Title')}>
          {t('section9Body')}
        </Section>

        <Section title={t('section10Title')}>
          {t('section10BodyPrefix')}{' '}
          <a href="mailto:info@opstapapp.nl" className="underline" style={{ color: 'var(--color-indigo-primary)' }}>
            {t('section10EmailLink')}
          </a>
          .
        </Section>
      </main>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-base font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
        {title}
      </h2>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
        {children}
      </p>
    </section>
  )
}
