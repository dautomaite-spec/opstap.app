'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { api } from '@/lib/api'
import BuyCreditsModal from './BuyCreditsModal'

export default function CreditsWidget({ collapsed }: { collapsed: boolean }) {
  const t = useTranslations('CreditsWidget')
  const [balance, setBalance] = useState<number | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    api.credits.balance()
      .then(b => setBalance(b.balance))
      .catch(() => {})
  }, [])

  if (balance === null) return null

  return (
    <>
      <div
        className="mx-2 mb-2 px-3 py-2 rounded-lg flex items-center gap-2"
        style={{
          background: 'rgba(255,255,255,0.08)',
          justifyContent: collapsed ? 'center' : 'space-between',
        }}
      >
        {collapsed ? (
          <button
            type="button"
            className="text-xs font-bold text-white cursor-pointer"
            onClick={() => setShowModal(true)}
            title={t('creditsTooltip', { balance })}
            aria-label={t('creditsTooltip', { balance })}
          >
            {balance}
          </button>
        ) : (
          <>
            <div className="flex items-center gap-1.5 min-w-0">
              <svg
                width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className="shrink-0"
                style={{ color: 'rgba(255,255,255,0.65)' }}
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4l3 3" />
              </svg>
              <span className="text-xs font-medium text-white truncate">
                {balance !== 1 ? t('creditsLabelPlural', { balance }) : t('creditsLabel', { balance })}
              </span>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="text-xs px-2 py-0.5 rounded-md shrink-0 transition"
              style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.25)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.15)' }}
            >
              {t('buyButton')}
            </button>
          </>
        )}
      </div>
      {showModal && (
        <BuyCreditsModal
          onClose={() => {
            setShowModal(false)
            // Refresh balance after modal closes (may have been a successful purchase redirect)
            api.credits.balance().then(b => setBalance(b.balance)).catch(() => {})
          }}
        />
      )}
    </>
  )
}
