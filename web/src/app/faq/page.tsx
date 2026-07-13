import Link from 'next/link'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import FaqAccordion from './FaqAccordion'
import PublicShell from '@/app/components/PublicShell'

export const metadata: Metadata = {
  title: 'Help & FAQ | Opstap',
  description: 'Veelgestelde vragen over Opstap: hoe werkt het, wat kost het en hoe beschermen we je gegevens?',
}

export default async function FaqPage() {
  const t = await getTranslations('FaqPage')

  const SECTIONS = [
    {
      title: t('section1Title'),
      items: [
        { q: t('section1Q1'), a: t('section1A1') },
        { q: t('section1Q2'), a: t('section1A2') },
        { q: t('section1Q3'), a: t('section1A3') },
      ],
    },
    {
      title: t('section2Title'),
      items: [
        { q: t('section2Q1'), a: t('section2A1') },
        { q: t('section2Q2'), a: t('section2A2') },
        { q: t('section2Q3'), a: t('section2A3') },
        { q: t('section2Q4'), a: t('section2A4') },
        { q: t('section2Q5'), a: t('section2A5') },
      ],
    },
    {
      title: t('section3Title'),
      items: [
        { q: t('section3Q1'), a: t('section3A1') },
        { q: t('section3Q2'), a: t('section3A2') },
        { q: t('section3Q3'), a: t('section3A3') },
      ],
    },
    {
      title: t('section4Title'),
      items: [
        { q: t('section4Q1'), a: t('section4A1') },
        { q: t('section4Q2'), a: t('section4A2') },
        { q: t('section4Q3'), a: t('section4A3') },
      ],
    },
  ]

  return (
    <PublicShell>
      <div className="max-w-2xl mx-auto px-6 py-16 md:py-24">

        <h1 className="text-4xl font-bold mb-3" style={{ color: 'var(--color-indigo-primary)' }}>
          {t('pageTitle')}
        </h1>
        <p className="text-base mb-12" style={{ color: 'var(--color-text-muted)' }}>
          {t('pageSubtitle')}{' '}
          <a href="/contact" className="underline" style={{ color: 'var(--color-indigo-primary)' }}>
            {t('contactLinkText')}
          </a>
          .
        </p>

        <div className="flex flex-col gap-12">
          {SECTIONS.map(section => (
            <section key={section.title}>
              <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-indigo-primary)' }}>
                {section.title}
              </h2>
              <FaqAccordion items={section.items} />
            </section>
          ))}
        </div>

      </div>
    </PublicShell>
  )
}
