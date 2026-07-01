import Link from 'next/link'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import PublicShell from '@/app/components/PublicShell'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('OverOnsPage')
  return {
    title: t('pageTitle'),
    description: t('pageDescription'),
  }
}

export default async function OverOnsPage() {
  const t = await getTranslations('OverOnsPage')
  return (
    <PublicShell>
      <div className="max-w-2xl mx-auto px-6 py-16 md:py-24">

        <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--color-indigo-primary)' }}>
          {t('heroTitle')}
        </h1>
        <p className="text-lg mb-12" style={{ color: 'var(--color-text-muted)' }}>
          {t('heroTagline')}
        </p>

        <div className="flex flex-col gap-10 text-base leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-indigo-primary)' }}>{t('section1Heading')}</h2>
            <p>
              {t('section1Para1')}
            </p>
            <p className="mt-4">
              {t('section1Para2')}
            </p>
            <p className="mt-4">
              {t('section1Para3')}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-indigo-primary)' }}>{t('section2Heading')}</h2>
            <p>
              {t('section2Para1')}
            </p>
            <p className="mt-4">
              {t('section2Para2')}
            </p>
            <ul className="mt-4 flex flex-col gap-2">
              {(['featureItem1', 'featureItem2', 'featureItem3', 'featureItem4'] as const).map(key => (
                <li key={key} className="flex items-start gap-2.5">
                  <svg className="mt-0.5 shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-indigo-primary)' }}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>{t(key)}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-indigo-primary)' }}>{t('section3Heading')}</h2>
            <p>
              {t('section3Para1')}
            </p>
          </section>

          <div
            className="rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-4"
            style={{ background: 'var(--color-lavender-card)' }}
          >
            <div className="flex-1">
              <p className="font-semibold text-base" style={{ color: 'var(--color-indigo-primary)' }}>{t('ctaHeading')}</p>
              <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
                {t('ctaSubtext')}
              </p>
            </div>
            <Link
              href="/register"
              className="shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90"
              style={{ background: 'var(--color-indigo-primary)' }}
            >
              {t('ctaButton')}
            </Link>
          </div>

        </div>

        {/* Legal footer */}
        <div className="mt-16 pt-8" style={{ borderTop: '1px solid var(--color-lavender-card)' }}>
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--color-text-muted)' }}>{t('legalSectionLabel')}</p>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)', opacity: 0.75 }}>
            {t('legalText')}{' '}
            <Link href="/privacy" className="underline hover:opacity-80" style={{ color: 'var(--color-text-muted)' }}>{t('legalPrivacyLink')}</Link>.
          </p>
        </div>

      </div>
    </PublicShell>
  )
}
