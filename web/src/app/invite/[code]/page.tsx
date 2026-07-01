import Link from 'next/link'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

export const metadata: Metadata = {
  title: 'Welkom bij Opstap',
  description: 'Opstap helpt je automatisch solliciteren op Nederlandse vacatures. Persoonlijke brieven, meerdere jobs tegelijk.',
  robots: { index: false, follow: false },
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  const t = await getTranslations('InvitePage')

  const steps = [
    {
      number: '1',
      title: t('step1Title'),
      body: t('step1Body'),
    },
    {
      number: '2',
      title: t('step2Title'),
      body: t('step2Body'),
    },
    {
      number: '3',
      title: t('step3Title'),
      body: t('step3Body'),
    },
    {
      number: '4',
      title: t('step4Title'),
      body: t('step4Body'),
    },
  ]

  return (
    <main className="min-h-screen" style={{ background: 'var(--color-lavender-bg)' }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-3xl mx-auto">
        <span className="font-bold text-xl" style={{ color: 'var(--color-indigo-primary)' }}>Opstap</span>
        <Link
          href={`/register?invite=${code}`}
          className="px-5 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'var(--color-indigo-primary)' }}
        >
          {t('navBeginButton')}
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-12">

        {/* Hero */}
        <h1 className="text-4xl font-bold leading-tight mb-4" style={{ color: 'var(--color-indigo-primary)' }}>
          {t('heroTitle')}
        </h1>
        <p className="text-lg mb-4" style={{ color: 'var(--color-text-muted)' }}>
          {t('heroBody1')}
        </p>
        <p className="text-lg mb-10" style={{ color: 'var(--color-text-muted)' }}>
          {t('heroBody2')}
        </p>

        {/* How it works */}
        <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>{t('howItWorksHeading')}</h2>
        <div className="flex flex-col gap-3 mb-12">
          {steps.map(step => (
            <div
              key={step.number}
              className="flex gap-4 rounded-2xl p-5"
              style={{ background: 'var(--color-white)', boxShadow: '0 2px 12px rgba(61,58,140,0.05)' }}
            >
              <div
                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                style={{ background: 'var(--color-indigo-primary)' }}
              >
                {step.number}
              </div>
              <div>
                <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>{step.title}</p>
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{step.body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div
          className="rounded-2xl p-8 text-center"
          style={{ background: 'var(--color-indigo-primary)' }}
        >
          <h2 className="text-xl font-bold text-white mb-2">{t('ctaHeading')}</h2>
          <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.75)' }}>
            {t('ctaBody')}
          </p>
          <Link
            href={`/register?invite=${code}`}
            className="inline-block px-8 py-3 rounded-xl font-semibold text-sm"
            style={{ background: 'var(--color-white)', color: 'var(--color-indigo-primary)' }}
          >
            {t('ctaButton')}
          </Link>
          <p className="text-xs mt-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {t('ctaPrivacyNote')}
          </p>
        </div>

        {/* Footer links */}
        <div className="flex gap-6 justify-center mt-10 text-xs" style={{ color: 'var(--color-text-muted)' }}>
          <Link href="/privacy" className="hover:underline">{t('footerPrivacy')}</Link>
          <Link href="/voorwaarden" className="hover:underline">{t('footerTerms')}</Link>
          <Link href="/faq" className="hover:underline">{t('footerFaq')}</Link>
        </div>
      </div>
    </main>
  )
}
