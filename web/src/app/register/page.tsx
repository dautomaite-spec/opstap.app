import Link from 'next/link'
import type { Metadata } from 'next'
import { register } from '@/app/actions/auth'

export const metadata: Metadata = {
  title: 'Gratis account aanmaken — Opstap',
  description: 'Maak gratis een Opstap-account aan en begin automatisch te solliciteren op Nederlandse vacatures.',
  alternates: { canonical: 'https://opstap.nl/register' },
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--color-lavender-bg)' }}>
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center font-bold text-2xl mb-8" style={{ color: 'var(--color-indigo-primary)' }}>
          Opstap
        </Link>

        <div className="rounded-2xl p-8" style={{ background: 'var(--color-white)', boxShadow: '0 2px 16px rgba(61,58,140,0.08)' }}>
          <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            Account aanmaken
          </h1>
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
            Gratis starten — geen creditcard nodig.
          </p>

          {error && (
            <p className="text-sm mb-4 px-3 py-2 rounded-lg" style={{ background: '#fef2f2', color: 'var(--color-error)' }}>
              {error}
            </p>
          )}

          <form action={register} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="naam" className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                Volledige naam
              </label>
              <input
                id="naam"
                name="naam"
                type="text"
                required
                autoComplete="name"
                className="px-3 py-2 rounded-lg border text-sm outline-none transition focus:ring-2"
                style={{
                  borderColor: 'var(--color-lavender-card)',
                  color: 'var(--color-text-primary)',
                  background: 'var(--color-lavender-bg)',
                }}
              />
            </div>

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

            <div className="flex flex-col gap-1">
              <label htmlFor="password" className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                Wachtwoord
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="px-3 py-2 rounded-lg border text-sm outline-none transition focus:ring-2"
                style={{
                  borderColor: 'var(--color-lavender-card)',
                  color: 'var(--color-text-primary)',
                  background: 'var(--color-lavender-bg)',
                }}
              />
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Minimaal 8 tekens</span>
            </div>

            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Door een account aan te maken ga je akkoord met onze{' '}
              <Link href="/voorwaarden" className="underline" style={{ color: 'var(--color-indigo-primary)' }}>
                algemene voorwaarden
              </Link>
              {' '}en ons{' '}
              <Link href="/privacy" className="underline" style={{ color: 'var(--color-indigo-primary)' }}>
                privacyvoorwaarden
              </Link>
              .
            </p>

            <button
              type="submit"
              className="mt-1 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90"
              style={{ background: 'var(--color-indigo-primary)' }}
            >
              Account aanmaken
            </button>
          </form>
        </div>

        <p className="text-center text-sm mt-6" style={{ color: 'var(--color-text-muted)' }}>
          Al een account?{' '}
          <Link href="/login" className="font-medium underline" style={{ color: 'var(--color-indigo-primary)' }}>
            Inloggen
          </Link>
        </p>
      </div>
    </main>
  )
}
