'use client'

import { useActionState, useState } from 'react'
import { Turnstile } from '@marsidev/react-turnstile'
import { submitContact, type ContactResult } from './actions'

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '1x00000000000000000000AA'

const SUBJECTS = {
  gebruiker: [
    'Vraag over Opstap',
    'Vraag over mijn account',
    'Probleem met een sollicitatie',
    'Bug melden',
    'Klacht',
    'Terugbetaling aanvragen',
    'Account verwijderen',
    'Overig',
  ],
  bedrijf: [
    'Samenwerking voorstellen',
    'Vacatureplaatsing',
    'Partnerschap / reseller',
    'Mediaverzoek / persvraag',
    'Voorstel voor integratie',
    'Overig',
  ],
}

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
  const [type, setType] = useState<'gebruiker' | 'bedrijf' | ''>('')

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
      {/* Honeypot */}
      <input name="website" type="text" tabIndex={-1} autoComplete="off" style={{ display: 'none' }} aria-hidden="true" />

      {/* Type */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
          Ik ben een <span aria-hidden style={{ color: 'var(--color-indigo-primary)' }}>*</span>
        </label>
        <select
          name="type"
          required
          value={type}
          onChange={e => setType(e.target.value as 'gebruiker' | 'bedrijf' | '')}
          style={inputStyle}
        >
          <option value="">Selecteer...</option>
          <option value="gebruiker">Gebruiker</option>
          <option value="bedrijf">Bedrijf / werkgever</option>
        </select>
      </div>

      {/* Subject — only shown after type is chosen */}
      {type && (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            Onderwerp <span aria-hidden style={{ color: 'var(--color-indigo-primary)' }}>*</span>
          </label>
          <select name="onderwerp" required style={inputStyle}>
            <option value="">Selecteer onderwerp...</option>
            {SUBJECTS[type].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
          Naam <span aria-hidden style={{ color: 'var(--color-indigo-primary)' }}>*</span>
        </label>
        <input name="naam" type="text" required maxLength={120} autoComplete="name" style={inputStyle} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
          {type === 'bedrijf' ? 'Bedrijfsnaam' : 'Bedrijf'}{' '}
          {type === 'bedrijf'
            ? <span aria-hidden style={{ color: 'var(--color-indigo-primary)' }}>*</span>
            : <span className="text-xs font-normal" style={{ color: 'var(--color-text-muted)' }}>(optioneel)</span>
          }
        </label>
        <input
          name="bedrijf"
          type="text"
          maxLength={120}
          required={type === 'bedrijf'}
          autoComplete="organization"
          style={inputStyle}
        />
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
        disabled={pending || !type}
        className="px-8 py-3 text-base font-semibold rounded-xl text-white transition hover:opacity-90 disabled:opacity-60"
        style={{ background: 'var(--color-indigo-primary)' }}
      >
        {pending ? 'Verzenden...' : 'Verstuur bericht'}
      </button>
    </form>
  )
}
