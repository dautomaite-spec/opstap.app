'use client'

import { useState } from 'react'
import Link from 'next/link'

const navLinks = [
  { href: '/dashboard', label: 'Vind vacatures' },
  { href: '/dashboard/profiel', label: 'Mijn profiel' },
  { href: '/dashboard/opgeslagen', label: 'Opgeslagen vacatures' },
  { href: '/over-ons', label: 'Over Opstap' },
  { href: '/faq', label: 'Help & FAQ' },
  { href: '/contact', label: 'Contact' },
  { href: '/privacy', label: 'Privacybeleid' },
]

export default function PublicMobileMenu({ userName }: { userName: string | null }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Hamburger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center w-8 h-8 rounded-lg"
        style={{ color: 'rgba(255,255,255,0.85)' }}
        aria-label="Menu openen"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <aside
        className="fixed inset-y-0 left-0 z-50 flex flex-col"
        style={{
          width: 260,
          background: 'var(--color-indigo-primary)',
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.2s ease',
        }}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
          <Link href="/" onClick={() => setOpen(false)} className="font-bold text-white text-lg tracking-tight">Opstap</Link>
          <button
            onClick={() => setOpen(false)}
            className="flex items-center justify-center w-8 h-8 rounded-lg"
            style={{ color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.08)' }}
            aria-label="Menu sluiten"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="flex items-center px-3 py-2.5 rounded-lg text-sm transition"
              style={{ color: 'rgba(255,255,255,0.75)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLElement).style.color = 'white' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.75)' }}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-5 border-t flex flex-col gap-3" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
          {userName ? (
            <div className="rounded-xl px-3 py-2.5 flex items-center gap-2" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{ background: 'rgba(255,255,255,0.25)', color: 'white' }}
              >
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm text-white truncate">{userName}</span>
            </div>
          ) : (
            <Link
              href="/register"
              onClick={() => setOpen(false)}
              className="w-full text-center py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90"
              style={{ background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.25)' }}
            >
              Aan de slag
            </Link>
          )}
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="text-center text-sm transition hover:opacity-80"
            style={{ color: 'rgba(255,255,255,0.6)' }}
          >
            Inloggen
          </Link>
        </div>
      </aside>
    </>
  )
}
