import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Betaling — Opstap',
}

export default async function BetalingTerugPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="max-w-sm text-center">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ background: 'var(--color-success-bg)' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-success-text)' }}>
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 className="text-lg font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
          Betaling in behandeling
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
          Je credits worden automatisch bijgeschreven zodra de betaling is bevestigd. Dit duurt meestal een paar seconden.
        </p>
        <Link
          href="/dashboard"
          className="inline-block px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90"
          style={{ background: 'var(--color-indigo-primary)' }}
        >
          Terug naar dashboard
        </Link>
      </div>
    </div>
  )
}
