'use client'

import { useState } from 'react'

const BASE = process.env.NEXT_PUBLIC_API_URL!

export default function WaitlistForm() {
  const [email, setEmail] = useState('')
  const [naam, setNaam] = useState('')
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setState('loading')
    setErrorMsg('')
    try {
      const res = await fetch(`${BASE}/api/v1/invite/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), naam: naam.trim() || undefined }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || 'Aanmelden mislukt')
      }
      setState('done')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Aanmelden mislukt')
      setState('error')
    }
  }

  if (state === 'done') {
    return (
      <div className="text-center py-4">
        <p className="font-semibold text-sm" style={{ color: 'var(--color-indigo-primary)' }}>Je staat op de lijst!</p>
        <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>We sturen je een uitnodiging zodra er plek is.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Je naam"
          value={naam}
          onChange={e => setNaam(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-xl border text-sm outline-none"
          style={{ borderColor: 'var(--color-lavender-card)', background: 'var(--color-lavender-bg)', color: 'var(--color-text-primary)' }}
        />
        <input
          type="email"
          required
          placeholder="Je e-mailadres"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-xl border text-sm outline-none"
          style={{ borderColor: 'var(--color-lavender-card)', background: 'var(--color-lavender-bg)', color: 'var(--color-text-primary)' }}
        />
        <button
          type="submit"
          disabled={state === 'loading'}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50 shrink-0"
          style={{ background: 'var(--color-indigo-primary)' }}
        >
          {state === 'loading' ? 'Bezig…' : 'Aanmelden'}
        </button>
      </div>
      {state === 'error' && (
        <p className="text-xs" style={{ color: 'var(--color-error)' }}>{errorMsg}</p>
      )}
      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
        We sturen je een persoonlijke uitnodigingslink. Geen spam, geen verplichtingen.
      </p>
    </form>
  )
}
