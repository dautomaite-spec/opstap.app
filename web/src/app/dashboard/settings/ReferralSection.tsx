'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://opstapapp.nl'
const BETA_INVITE_LIMIT = 5

export default function ReferralSection() {
  const [code, setCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [creditsEarned, setCreditsEarned] = useState(0)
  const [referralCount, setReferralCount] = useState(0)

  useEffect(() => {
    api.credits.balance().then(b => setCode(b.referral_code)).catch(() => {})
    api.credits.transactions()
      .then(txs => {
        const referrals = txs.filter(t => t.reason?.toLowerCase().includes('referral') && t.delta > 0)
        setCreditsEarned(referrals.reduce((sum, t) => sum + t.delta, 0))
        setReferralCount(referrals.length)
      })
      .catch(() => {})
  }, [])

  if (!code) return null

  const link = `${SITE_URL}/register?ref=${code}`

  async function handleCopy() {
    await navigator.clipboard.writeText(link).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-lg border"
        style={{ borderColor: 'var(--color-lavender-card)', background: 'var(--color-lavender-bg)' }}
      >
        <span className="text-xs flex-1 truncate font-mono" style={{ color: 'var(--color-text-muted)' }}>
          {link}
        </span>
        <button
          onClick={handleCopy}
          className="text-xs px-3 py-1 rounded-lg shrink-0 transition font-medium"
          style={{
            background: copied ? 'var(--color-success-bg)' : 'var(--color-indigo-primary)',
            color: copied ? 'var(--color-success-text)' : 'white',
          }}
        >
          {copied ? 'Gekopieerd!' : 'Kopieer'}
        </button>
      </div>
      <div className="flex items-center justify-between mt-2">
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          Je code: <span className="font-mono font-medium" style={{ color: 'var(--color-text-primary)' }}>{code}</span>
        </p>
        {creditsEarned > 0 && (
          <p className="text-xs font-medium" style={{ color: '#065f46' }}>
            +{creditsEarned} credit{creditsEarned !== 1 ? 's' : ''} verdiend
          </p>
        )}
      </div>
      <div className="flex items-center justify-between mt-1.5">
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          Jij hebt{' '}
          <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{referralCount} van {BETA_INVITE_LIMIT}</span>
          {' '}uitnodigingen gebruikt
        </p>
        {referralCount >= BETA_INVITE_LIMIT && (
          <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Limiet bereikt</p>
        )}
      </div>
    </div>
  )
}
