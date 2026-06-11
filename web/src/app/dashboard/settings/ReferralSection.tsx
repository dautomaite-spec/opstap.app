'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://opstapapp.nl'

export default function ReferralSection() {
  const [code, setCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    api.credits.balance()
      .then(b => setCode(b.referral_code))
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
      <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
        Je code: <span className="font-mono font-medium" style={{ color: 'var(--color-text-primary)' }}>{code}</span>
      </p>
    </div>
  )
}
