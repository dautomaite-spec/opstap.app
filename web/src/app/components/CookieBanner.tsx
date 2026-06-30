'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'

const CONSENT_KEY = 'opstap_cookie_consent'

export type CookieConsent = 'accepted' | 'rejected' | null

function getStoredConsent(): CookieConsent {
  try {
    const raw = localStorage.getItem(CONSENT_KEY)
    return (raw === 'accepted' || raw === 'rejected') ? raw : null
  } catch { return null }
}

function storeConsent(val: 'accepted' | 'rejected') {
  try { localStorage.setItem(CONSENT_KEY, val) } catch {}
}

function applyConsent(val: 'accepted' | 'rejected') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ph = (window as any).posthog
  if (!ph) return
  if (val === 'accepted') ph.opt_in_capturing?.()
  else ph.opt_out_capturing?.()
}

export default function CookieBanner() {
  const t = useTranslations('CookieBanner')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const stored = getStoredConsent()
    if (!stored) {
      setVisible(true)
    } else {
      // Apply previously stored consent to PostHog (loaded after hydration)
      applyConsent(stored)
    }
  }, [])

  function accept() {
    storeConsent('accepted')
    applyConsent('accepted')
    setVisible(false)
  }

  function reject() {
    storeConsent('rejected')
    applyConsent('rejected')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label={t('ariaLabel')}
      className="fixed bottom-0 left-0 right-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(26,24,48,0.45)', backdropFilter: 'blur(2px)' }}
    >
      <div
        className="w-full max-w-lg rounded-2xl p-5 shadow-2xl"
        style={{ background: 'var(--color-white)', border: '1px solid var(--color-lavender-card)' }}
      >
        <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
          {t('analyticsHeading')}
        </p>
        <p className="text-xs mb-4" style={{ color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
          {t('analyticsDescription')}{' '}
          <a href="/privacy" className="underline" style={{ color: 'var(--color-indigo-primary)' }}>{t('privacyLink')}</a>.
        </p>
        <div className="flex gap-2">
          <button
            onClick={accept}
            className="flex-1 py-2 rounded-xl text-sm font-semibold text-white transition hover:opacity-90"
            style={{ background: 'var(--color-indigo-primary)' }}
          >
            {t('acceptButton')}
          </button>
          <button
            onClick={reject}
            className="flex-1 py-2 rounded-xl text-sm font-medium transition border"
            style={{
              borderColor: 'var(--color-lavender-card)',
              color: 'var(--color-text-muted)',
              background: 'var(--color-lavender-bg)',
            }}
          >
            {t('rejectButton')}
          </button>
        </div>
      </div>
    </div>
  )
}
