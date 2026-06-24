import type { Metadata } from 'next'
import Link from 'next/link'
import { forgotPassword } from '@/app/actions/auth'

export const metadata: Metadata = {
  title: 'Wachtwoord vergeten | Opstap',
  robots: { index: false, follow: false },
}

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>
}) {
  const { error, sent } = await searchParams

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--color-lavender-bg)' }}>
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center font-bold text-2xl mb-8" style={{ color: 'var(--color-indigo-primary)' }}>
          Opstap
        </Link>

        <div className="rounded-2xl p-8" style={{ background: 'var(--color-white)', boxShadow: '0 2px 16px rgba(61,58,140,0.08)' }}>
          <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            Wachtwoord vergeten
          </h1>

          {sent ? (
            <>
              <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
                Als er een account bestaat voor dit e-mailadres, ontvang je binnen enkele minuten een resetlink. Controleer ook je spammap.
              </p>
              <Link
                href="/login"
                className="block text-center py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90"
                style={{ background: 'var(--color-indigo-primary)' }}
              >
                Terug naar inloggen
              </Link>
            </>
          ) : (
            <>
              <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
                Vul je e-mailadres in en we sturen je een resetlink.
              </p>

              {error && (
                <p className="text-sm mb-4 px-3 py-2 rounded-lg" style={{ background: '#fef2f2', color: 'var(--color-error)' }}>
                  {error}
                </p>
              )}

              <form action={forgotPassword} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label htmlFor="email" className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    E-mailadres
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    className="px-3 py-2 rounded-lg border text-sm outline-none transition focus:ring-2"
                    style={{
                      borderColor: 'var(--color-lavender-card)',
                      color: 'var(--color-text-primary)',
                      background: 'var(--color-lavender-bg)',
                    }}
                  />
                </div>
                <button
                  type="submit"
                  className="mt-1 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90"
                  style={{ background: 'var(--color-indigo-primary)' }}
                >
                  Resetlink versturen
                </button>
              </form>
            </>
          )}
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
