'use client'

import Link from 'next/link'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="nl">
      <body>
        <main
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            background: '#F0EEFF',
            fontFamily: 'sans-serif',
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: '400px' }}>
            <p style={{ fontWeight: 700, fontSize: '1.25rem', color: '#1E1B4B', marginBottom: '0.5rem' }}>
              Er is iets misgegaan
            </p>
            <p style={{ color: '#6B7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              We hebben het probleem geregistreerd en kijken ernaar. Probeer het opnieuw.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={reset}
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: '0.75rem',
                  background: '#3D3A8C',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Opnieuw proberen
              </button>
              <Link
                href="/"
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: '0.75rem',
                  border: '1px solid #E0DCFF',
                  color: '#3D3A8C',
                  fontSize: '0.875rem',
                  textDecoration: 'none',
                }}
              >
                Naar home
              </Link>
            </div>
          </div>
        </main>
      </body>
    </html>
  )
}
