import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Bevestig je e-mail — Opstap',
  robots: { index: false, follow: false },
}

export default function BevestigPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--color-lavender-bg)' }}>
      <div className="w-full max-w-sm text-center">
        <Link href="/" className="block font-bold text-2xl mb-8" style={{ color: 'var(--color-indigo-primary)' }}>
          Opstap
        </Link>

        <div className="rounded-2xl p-8" style={{ background: 'var(--color-white)', boxShadow: '0 2px 16px rgba(61,58,140,0.08)' }}>
          <div className="text-4xl mb-4">✉️</div>
          <h1 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>
            Bevestig je e-mailadres
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            We hebben een bevestigingslink gestuurd naar je e-mailadres. Klik op de link in de e-mail om je account te activeren.
          </p>
          <p className="text-xs mt-4" style={{ color: 'var(--color-text-muted)' }}>
            Geen e-mail ontvangen? Controleer je spammap.
          </p>
        </div>

        <p className="text-center text-sm mt-6" style={{ color: 'var(--color-text-muted)' }}>
          <Link href="/login" className="underline" style={{ color: 'var(--color-indigo-primary)' }}>
            Terug naar inloggen
          </Link>
        </p>
      </div>
    </main>
  )
}
