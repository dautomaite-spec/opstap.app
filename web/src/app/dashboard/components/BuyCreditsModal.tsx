'use client'

import { useState } from 'react'
import { api, ApiError } from '@/lib/api'

const BUNDLES = [
  { key: '10' as const, credits: 10, price: '€2,99', perCredit: '€0,30/credit' },
  { key: '30' as const, credits: 30, price: '€6,99', perCredit: '€0,23/credit', popular: true },
  { key: '75' as const, credits: 75, price: '€14,99', perCredit: '€0,20/credit' },
]

export default function BuyCreditsModal({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState<'10' | '30' | '75'>('30')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handlePurchase() {
    setLoading(true)
    setError('')
    try {
      const { checkout_url } = await api.credits.purchase(selected)
      window.location.href = checkout_url
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Betaling starten mislukt. Probeer het opnieuw.')
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: 'var(--color-white)' }}>
        <div className="flex items-start justify-between mb-1">
          <h3 className="font-bold text-base" style={{ color: 'var(--color-text-primary)' }}>Credits kopen</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-sm transition"
            style={{ color: 'var(--color-text-muted)', background: 'var(--color-lavender-card)' }}
          >
            ×
          </button>
        </div>
        <p className="text-xs mb-5" style={{ color: 'var(--color-text-muted)' }}>
          1 credit = 1 motivatiebrief. Credits verlopen nooit.
        </p>

        <div className="flex flex-col gap-2 mb-5">
          {BUNDLES.map(b => (
            <button
              key={b.key}
              onClick={() => setSelected(b.key)}
              className="relative flex items-center justify-between px-4 py-3 rounded-xl border-2 text-left transition"
              style={{
                borderColor: selected === b.key ? 'var(--color-indigo-primary)' : 'var(--color-lavender-card)',
                background: selected === b.key ? 'rgba(61,58,140,0.04)' : 'var(--color-lavender-bg)',
              }}
            >
              <div>
                <span className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                  {b.credits} credits
                </span>
                {b.popular && (
                  <span
                    className="ml-2 text-xs px-1.5 py-0.5 rounded-full font-medium"
                    style={{ background: 'var(--color-indigo-primary)', color: 'white' }}
                  >
                    Populair
                  </span>
                )}
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{b.perCredit}</p>
              </div>
              <span className="font-bold text-sm" style={{ color: 'var(--color-indigo-primary)' }}>{b.price}</span>
            </button>
          ))}
        </div>

        {error && (
          <p className="text-xs mb-4 px-3 py-2 rounded-lg" style={{ background: 'var(--color-error-bg)', color: 'var(--color-error)' }}>
            {error}
          </p>
        )}

        <button
          onClick={handlePurchase}
          disabled={loading}
          className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          style={{ background: 'var(--color-indigo-primary)' }}
        >
          {loading ? 'Bezig…' : 'Betalen via iDEAL'}
        </button>
        <p className="text-xs text-center mt-3" style={{ color: 'var(--color-text-muted)' }}>
          Veilig betalen via Mollie · iDEAL
        </p>
      </div>
    </div>
  )
}
