'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://opstapapp.nl'
const BETA_INVITE_LIMIT = 10

function shareMessage(link: string) {
  return `Probeer Opstap nu gratis via mijn link — we ontvangen allebei credits om onze droombaan te vinden! 🎯\n\n${link}`
}

export default function ReferralSection() {
  const [code, setCode] = useState<string | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedMsg, setCopiedMsg] = useState(false)
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
  const message = shareMessage(link)

  async function handleCopyLink() {
    await navigator.clipboard.writeText(link).catch(() => {})
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  async function handleCopyMessage() {
    await navigator.clipboard.writeText(message).catch(() => {})
    setCopiedMsg(true)
    setTimeout(() => setCopiedMsg(false), 2000)
  }

  function handleWhatsApp() {
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div>
      {/* Link row */}
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-lg border"
        style={{ borderColor: 'var(--color-lavender-card)', background: 'var(--color-lavender-bg)' }}
      >
        <span className="text-xs flex-1 truncate font-mono" style={{ color: 'var(--color-text-muted)' }}>
          {link}
        </span>
        <button
          onClick={handleCopyLink}
          className="text-xs px-3 py-1 rounded-lg shrink-0 transition font-medium"
          style={{
            background: copiedLink ? 'var(--color-success-bg)' : 'var(--color-indigo-primary)',
            color: copiedLink ? 'var(--color-success-text)' : 'white',
          }}
        >
          {copiedLink ? 'Gekopieerd!' : 'Kopieer link'}
        </button>
      </div>

      {/* Share buttons */}
      <div className="flex gap-2 mt-2">
        <button
          onClick={handleWhatsApp}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-lg font-medium transition"
          style={{ background: '#25D366', color: 'white' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.88' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Deel via WhatsApp
        </button>
        <button
          onClick={handleCopyMessage}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-lg font-medium transition border"
          style={{
            borderColor: 'var(--color-lavender-card)',
            background: copiedMsg ? 'var(--color-success-bg)' : 'var(--color-lavender-bg)',
            color: copiedMsg ? 'var(--color-success-text)' : 'var(--color-text-primary)',
          }}
        >
          {copiedMsg ? (
            'Gekopieerd!'
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              Kopieer bericht
            </>
          )}
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
