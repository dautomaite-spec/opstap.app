'use client'

import { useActionState } from 'react'
import { Turnstile } from '@marsidev/react-turnstile'
import { submitContact, type ContactResult } from './actions'

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '1x00000000000000000000AA'

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 10,
  border: '1px solid var(--color-border)',
  background: 'var(--color-lavender-bg)',
  color: 'var(--color-text-primary)',
  fontSize: 14,
  outline: 'none',
} as const

export default function ContactForm() {
  const [state, action, pending] = useActionState<ContactResult | null, FormData>(submitContact, null)

  if (state?.ok) {
    return (
      <div className="rounded-2xl p-8 text-center" style={{ background: 'var(--color-lavender-card)' }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4" style={{ color: 'var(--color-indigo-primary)' }}>
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <p className="font-semibold text-lg mb-1" style={{ color: 'var(--color-indigo-primary)' }}>Bericht verzonden!</p>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>We reageren binnen één werkdag.</p>
      </div>
    )
  }

  return (
    <form action={action} className="flex flex-col gap-5">
      {/* Honeypot — hidden from humans */}
      <input name="website" type="text" tabIndex={-1} autoComplete="off" style={{ display: 'none' }} aria-hidden="true" />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
          Naam <span aria-hidden style={{ color: 'var(--color-indigo-primary)' }}>*</span>
        </label>
        <input name="naam" type="text" required maxLength={120} autoComplete="name" style={inputStyle} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
          Bedrijf <span className="text-xs font-normal" style={{ color: 'var(--color-text-muted)' }}>(optioneel)</span>
        </label>
        <input name="bedrijf" type="text" maxLength={120} autoComplete="organization" style={inputStyle} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
          E-mail <span aria-hidden style={{ color: 'var(--color-indigo-primary)' }}>*</span>
        </label>
        <input name="email" type="email" required maxLength={254} autoComplete="email" style={inputStyle} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
          Bericht <span aria-hidden style={{ color: 'var(--color-indigo-primary)' }}>*</span>
        </label>
        <textarea
          name="bericht"
          required
          minLength={10}
          maxLength={2000}
          rows={5}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </div>

      <Turnstile siteKey={SITE_KEY} />

      {state && !state.ok && (
        <p className="text-sm font-medium" style={{ color: '#e53e3e' }}>{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="px-8 py-3 text-base font-semibold rounded-xl text-white transition hover:opacity-90 disabled:opacity-60"
        style={{ background: 'var(--color-indigo-primary)' }}
      >
        {pending ? 'Verzenden...' : 'Verstuur bericht'}
      </button>
    </form>
  )
}
