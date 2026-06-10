'use client'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const GOOGLE_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

const SECONDARY_PROVIDERS = [
  {
    id: 'azure' as const,
    label: 'Outlook',
    icon: (
      <svg width="16" height="16" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
        <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
        <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
        <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
      </svg>
    ),
  },
  {
    id: 'facebook' as const,
    label: 'Meta',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="#1877F2" xmlns="http://www.w3.org/2000/svg">
        <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.696 4.533-4.696 1.312 0 2.686.235 2.686.235v2.97h-1.514c-1.491 0-1.956.93-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
      </svg>
    ),
  },
]

type OAuthProvider = 'google' | 'azure' | 'facebook'

interface SocialButtonsProps {
  redirectTo?: string
  showSkip?: boolean
}

export default function SocialButtons({ redirectTo, showSkip = false }: SocialButtonsProps) {
  const supabase = createClient()

  async function handleOAuth(provider: OAuthProvider) {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectTo ?? `${window.location.origin}/auth/confirm?next=/dashboard`,
        scopes: provider === 'azure' ? 'email profile' : undefined,
      },
    })
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Google — primary, full-width */}
      <button
        type="button"
        onClick={() => handleOAuth('google')}
        className="flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border text-sm font-semibold transition hover:opacity-80"
        style={{ borderColor: 'var(--color-lavender-card)', color: 'var(--color-text-primary)', background: 'var(--color-white)' }}
      >
        {GOOGLE_ICON}
        Doorgaan met Google
      </button>

      {/* Outlook / Meta — compact row */}
      <div className="flex gap-2">
        {SECONDARY_PROVIDERS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => handleOAuth(p.id)}
            title={`Doorgaan met ${p.label}`}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition hover:opacity-80"
            style={{ borderColor: 'var(--color-lavender-card)', color: 'var(--color-text-primary)', background: 'var(--color-white)' }}
          >
            {p.icon}
            <span>{p.label}</span>
          </button>
        ))}
      </div>

      {showSkip && (
        <Link
          href="/"
          className="block text-center text-xs mt-1 transition hover:opacity-70"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Overslaan
        </Link>
      )}
    </div>
  )
}
