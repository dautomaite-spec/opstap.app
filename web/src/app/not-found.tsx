import Link from 'next/link'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

export const metadata: Metadata = {
  title: 'Pagina niet gevonden | Opstap',
  robots: { index: false, follow: false },
}

export default async function NotFound() {
  const t = await getTranslations('NotFound')

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'var(--color-lavender-bg)' }}>
      <div className="text-center max-w-sm">
        <p className="text-5xl font-bold mb-4" style={{ color: 'var(--color-indigo-primary)' }}>404</p>
        <p className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
          {t('heading')}
        </p>
        <p className="text-sm mb-8" style={{ color: 'var(--color-text-muted)' }}>
          {t('description')}
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90"
          style={{ background: 'var(--color-indigo-primary)' }}
        >
          {t('homeButton')}
        </Link>
      </div>
    </main>
  )
}
