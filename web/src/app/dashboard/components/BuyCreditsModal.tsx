'use client'

import { useTranslations } from 'next-intl'

export default function BuyCreditsModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations('BuyCreditsModal')
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: 'var(--color-white)' }}>
        <div className="flex items-start justify-between mb-4">
          <h3 className="font-bold text-base" style={{ color: 'var(--color-text-primary)' }}>{t('modalTitle')}</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-sm transition"
            style={{ color: 'var(--color-text-muted)', background: 'var(--color-lavender-card)' }}
          >
            {t('closeButton')}
          </button>
        </div>

        <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--color-lavender-card)' }}>
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-indigo-primary)' }}>
            {t('betaBannerTitle')}
          </p>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
            {t.rich('betaBannerDescription', {
              strongOpen: () => <strong style={{ color: 'var(--color-text-primary)' }}>+2 gratis credits</strong>,
              strongClose: () => null,
            })}
          </p>
        </div>

        <div className="flex flex-col gap-2 mb-5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
          <div className="flex items-center gap-2">
            <span style={{ color: 'var(--color-indigo-primary)' }}>✓</span>
            <span>{t('featureCreditExplained')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span style={{ color: 'var(--color-indigo-primary)' }}>✓</span>
            <span>{t('featureReferral')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span style={{ color: 'var(--color-indigo-primary)' }}>✓</span>
            <span>{t('featureNoExpiry')}</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90"
          style={{ background: 'var(--color-indigo-primary)' }}
        >
          {t('understoodButton')}
        </button>
        <p className="text-xs text-center mt-3" style={{ color: 'var(--color-text-muted)' }}>
          {t('paymentFootnote')}
        </p>
      </div>
    </div>
  )
}
