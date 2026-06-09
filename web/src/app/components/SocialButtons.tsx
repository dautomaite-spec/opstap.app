'use client'

import { createClient } from '@/lib/supabase/client'

const PROVIDERS = [
  {
    id: 'azure' as const,
    label: 'Microsoft',
    icon: (
      <svg width="18" height="18" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
        <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
        <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
        <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
      </svg>
    ),
  },
  {
    id: 'apple' as const,
    label: 'Apple',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 3.99zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
      </svg>
    ),
  },
  {
    id: 'facebook' as const,
    label: 'Meta',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2" xmlns="http://www.w3.org/2000/svg">
        <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.696 4.533-4.696 1.312 0 2.686.235 2.686.235v2.97h-1.514c-1.491 0-1.956.93-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
      </svg>
    ),
  },
]

interface SocialButtonsProps {
  redirectTo?: string
}

export default function SocialButtons({ redirectTo }: SocialButtonsProps) {
  const supabase = createClient()

  async function handleOAuth(provider: 'azure' | 'apple' | 'facebook') {
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
      {PROVIDERS.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => handleOAuth(p.id)}
          className="flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border text-sm font-medium transition hover:bg-gray-50"
          style={{ borderColor: 'var(--color-lavender-card)', color: 'var(--color-text-primary)', background: 'var(--color-white)' }}
        >
          {p.icon}
          Doorgaan met {p.label}
        </button>
      ))}
    </div>
  )
}
