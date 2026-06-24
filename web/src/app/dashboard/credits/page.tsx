'use client'

import Link from 'next/link'

export default function CreditsPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16"
      style={{ background: 'var(--color-lavender-bg)' }}>

      <div className="w-full max-w-sm rounded-2xl p-8 shadow-sm text-center"
        style={{ background: 'var(--color-white)', border: '1px solid var(--color-lavender-card)' }}>

        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{ background: 'var(--color-lavender-card)' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke="var(--color-indigo-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
        </div>

        <h1 className="text-lg font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
          Credits kopen — binnenkort
        </h1>
        <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--color-text-muted)' }}>
          Betaalde credits zijn nog niet beschikbaar. Tijdens de beta ontvang je elke dag automatisch
          <strong style={{ color: 'var(--color-text-primary)' }}> +2 gratis credits</strong>, tot een maximum van 15.
        </p>

        <div className="rounded-xl p-4 mb-6 text-left" style={{ background: 'var(--color-lavender-card)' }}>
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-indigo-primary)' }}>
            Meer credits nodig?
          </p>
          <ul className="flex flex-col gap-1.5">
            {[
              'Nodig iemand uit via jouw referral link (+3 credits)',
              'Stuur feedback via "Probleem melden" (+2 bonus)',
              'Credits verlopen nooit',
            ].map(item => (
              <li key={item} className="flex items-start gap-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                <span style={{ color: 'var(--color-indigo-primary)', flexShrink: 0 }}>✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <Link
          href="/dashboard"
          className="block w-full py-2.5 rounded-xl text-sm font-semibold text-white text-center transition hover:opacity-90"
          style={{ background: 'var(--color-indigo-primary)' }}
        >
          Terug naar vacatures
        </Link>
      </div>
    </main>
  )
}
