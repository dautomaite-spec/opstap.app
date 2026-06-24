import Link from 'next/link'
import type { Metadata } from 'next'
import { login } from '@/app/actions/auth'
import SocialButtons from '@/app/components/SocialButtons'

export const metadata: Metadata = {
  title: 'Inloggen | Opstap',
  robots: { index: false, follow: false },
}

export default async function LoginPage({
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
          <h1 className="text-xl font-bold mb-6" style={{ color: 'var(--color-text-primary)' }}>
            Inloggen
          </h1>

          {error && (
            <p className="text-sm mb-4 px-3 py-2 rounded-lg" style={{ background: '#fef2f2', color: 'var(--color-error)' }}>
              {error}
            </p>
          )}

          <form action={login} className="flex flex-col gap-4">
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
                autoComplete="current-password"
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
              className="mt-2 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90"
              style={{ background: 'var(--color-indigo-primary)' }}
            >
              Inloggen
            </button>
          </form>

          <p className="text-center text-sm mt-4">
            <Link href="/forgot-password" className="underline" style={{ color: 'var(--color-text-muted)' }}>
              Wachtwoord vergeten?
            </Link>
          </p>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px" style={{ background: 'var(--color-lavender-card)' }} />
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>of</span>
            <div className="flex-1 h-px" style={{ background: 'var(--color-lavender-card)' }} />
          </div>

          <SocialButtons />
        </div>

        <p className="text-center text-sm mt-6" style={{ color: 'var(--color-text-muted)' }}>
          Nog geen account?{' '}
          <Link href="/register" className="font-medium underline" style={{ color: 'var(--color-indigo-primary)' }}>
            Account aanmaken
          </Link>
        </p>
      </div>
    </main>
  )
}
