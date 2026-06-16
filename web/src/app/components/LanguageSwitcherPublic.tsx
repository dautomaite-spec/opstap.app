'use client'

import { useState } from 'react'

const langs = [
  { code: 'NL', flag: '🇳🇱', label: 'Nederlands', active: true },
  { code: 'EN', flag: '🇬🇧', label: 'English', active: false },
  { code: 'AR', flag: '🇸🇦', label: 'العربية', active: false },
  { code: 'TR', flag: '🇹🇷', label: 'Türkçe', active: false },
  { code: 'UK', flag: '🇺🇦', label: 'Українська', active: false },
]

export default function LanguageSwitcherPublic() {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition hover:opacity-80"
        style={{ color: 'rgba(255,255,255,0.85)', background: 'rgba(255,255,255,0.12)' }}
        title="Taal"
      >
        <span style={{ fontSize: 18, lineHeight: 1 }}>🇳🇱</span>
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
            {langs.map(l => (
              <div
                key={l.code}
                className="flex items-center gap-2.5 px-3 py-2"
                style={{
                  cursor: l.active ? 'pointer' : 'not-allowed',
                  opacity: l.active ? 1 : 0.45,
                }}
              >
                <span>{l.flag}</span>
                <span className="text-sm flex-1" style={{ color: 'var(--color-text-primary)', fontWeight: l.active ? 600 : 400 }}>{l.label}</span>
                {!l.active && <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>binnenkort</span>}
                {l.active && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-indigo-primary)' }}>
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
