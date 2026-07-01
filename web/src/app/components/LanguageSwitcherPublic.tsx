'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { setLocale } from '@/actions/setLocale'

const langs = [
  { code: 'nl', flag: '🇳🇱', label: 'Nederlands' },
  { code: 'en', flag: '🇬🇧', label: 'English' },
  { code: 'tr', flag: '🇹🇷', label: 'Türkçe' },
  { code: 'uk', flag: '🇺🇦', label: 'Українська' },
  { code: 'pl', flag: '🇵🇱', label: 'Polski' },
  { code: 'ro', flag: '🇷🇴', label: 'Română' },
]

export default function LanguageSwitcherPublic() {
  const [open, setOpen] = useState(false)
  const locale = useLocale()
  const router = useRouter()

  const currentLang = langs.find(l => l.code === locale) ?? langs[0]

  async function handleSelect(code: string) {
    await setLocale(code)
    setOpen(false)
    router.refresh()
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition hover:opacity-80"
        style={{ color: 'rgba(255,255,255,0.85)', background: 'rgba(255,255,255,0.12)' }}
        title="Taal"
      >
        <span style={{ fontSize: 18, lineHeight: 1 }}>{currentLang.flag}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full mt-1 rounded-xl border py-1 z-50"
            style={{ minWidth: 180, background: 'var(--color-white)', borderColor: 'var(--color-lavender-card)', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
          >
            {langs.map(l => {
              const isActive = l.code === locale
              return (
                <button
                  key={l.code}
                  onClick={() => handleSelect(l.code)}
                  className="flex items-center gap-2.5 px-3 py-2 w-full text-left"
                  style={{ cursor: 'pointer' }}
                >
                  <span>{l.flag}</span>
                  <span className="text-sm flex-1" style={{ color: 'var(--color-text-primary)', fontWeight: isActive ? 600 : 400 }}>{l.label}</span>
                  {isActive && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-indigo-primary)' }}>
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
