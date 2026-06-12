'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/actions/auth'
import ThemeToggle from '@/app/components/ThemeToggle'
import CreditsWidget from './CreditsWidget'

const navItems = [
  {
    href: '/dashboard/profiel',
    label: 'Mijn profiel',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
  {
    href: '/dashboard/settings',
    label: 'Instellingen',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
      </svg>
    ),
  },
  {
    href: '/dashboard',
    label: 'Vind vacatures',
    exact: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
      </svg>
    ),
  },
  {
    href: '/dashboard/opgeslagen',
    label: 'Opgeslagen vacatures',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    href: '/dashboard/sollicitaties',
    label: 'Jouw reacties',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" /><path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
]

const secondaryItems = [
  {
    href: '/over-ons',
    label: 'Over Opstap',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M12 16v-4m0-4h.01" />
      </svg>
    ),
  },
  {
    href: '/faq',
    label: 'Help & FAQ',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3m.08 4h.01" />
      </svg>
    ),
  },
]

export default function DashboardShell({
  userName,
  userEmail,
  children,
}: {
  userName: string
  userEmail: string
  children: React.ReactNode
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  const initials = (userName.charAt(0) || userEmail.charAt(0)).toUpperCase()
  const sidebarW = collapsed ? 64 : 240

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  const sidebarContent = (
    <>
      {/* Header */}
      <div
        className="flex items-center border-b px-3 shrink-0"
        style={{
          borderColor: 'rgba(255,255,255,0.12)',
          height: 56,
          justifyContent: collapsed ? 'center' : 'space-between',
        }}
      >
        {!collapsed && (
          <Link href="/" className="font-bold text-base text-white tracking-tight hover:opacity-80 transition">Opstap</Link>
        )}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="hidden md:flex items-center justify-center w-7 h-7 rounded-lg transition"
          style={{ color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.08)' }}
          aria-label={collapsed ? 'Uitklappen' : 'Inklappen'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {collapsed ? <path d="m9 18 6-6-6-6" /> : <path d="m15 18-6-6 6-6" />}
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 pr-8">
        {navItems.map(item => {
          const active = isActive(item.href, item.exact)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              title={collapsed ? item.label : undefined}
              className="flex items-center gap-3 mx-2 rounded-lg transition"
              style={{
                padding: collapsed ? '10px 0' : '10px 12px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                color: active ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.65)',
                background: active ? 'rgba(255,255,255,0.15)' : 'transparent',
                fontWeight: active ? 600 : 400,
                fontSize: '0.875rem',
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)' }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              <span className="shrink-0">{item.icon}</span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          )
        })}
        <div className="my-2 mx-3 h-px" style={{ background: 'rgba(255,255,255,0.12)' }} />
        {secondaryItems.map(item => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              title={collapsed ? item.label : undefined}
              className="flex items-center gap-3 mx-2 rounded-lg transition"
              style={{
                padding: collapsed ? '10px 0' : '10px 12px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                color: active ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.55)',
                background: active ? 'rgba(255,255,255,0.15)' : 'transparent',
                fontWeight: active ? 600 : 400,
                fontSize: '0.8125rem',
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)' }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              <span className="shrink-0">{item.icon}</span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Credits widget */}
      <CreditsWidget collapsed={collapsed} />

      {/* Footer */}
      <div
        className="shrink-0 border-t py-3"
        style={{ borderColor: 'rgba(255,255,255,0.12)' }}
      >
        <div
          className="flex items-center gap-3 mx-2 px-2 py-2 rounded-lg"
          style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-semibold"
            style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}
          >
            {initials}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              {userName && (
                <p className="text-xs font-medium text-white truncate">{userName}</p>
              )}
              <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.55)' }}>{userEmail}</p>
            </div>
          )}
        </div>
        <form action={logout} className="mx-2 mt-1">
          <button
            type="submit"
            title={collapsed ? 'Uitloggen' : undefined}
            className="w-full flex items-center gap-3 rounded-lg px-2 py-2 text-xs transition"
            style={{
              color: 'rgba(255,255,255,0.55)',
              justifyContent: collapsed ? 'center' : 'flex-start',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.9)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.55)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            {!collapsed && <span>Uitloggen</span>}
          </button>
        </form>
      </div>
    </>
  )

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--color-lavender-bg)' }}>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex shrink-0 transition-all duration-200"
        style={{ width: sidebarW, position: 'relative' }}
      >
        {/* Decorative background circles — only when expanded */}
        {!collapsed && (
          <svg aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }} viewBox="0 0 240 800" preserveAspectRatio="xMidYMid slice">
            <circle cx="215" cy="85" r="75" fill="rgba(255,255,255,0.06)" />
            <circle cx="190" cy="560" r="62" fill="rgba(255,255,255,0.05)" />
            <circle cx="220" cy="330" r="40" fill="rgba(255,255,255,0.04)" />
            <circle cx="155" cy="740" r="88" fill="rgba(255,255,255,0.03)" />
          </svg>
        )}

        {/* Organic right-edge wave */}
        {!collapsed && (
          <svg aria-hidden style={{ position: 'absolute', top: 0, right: 0, width: 40, height: '100%', zIndex: 5, pointerEvents: 'none' }} viewBox="0 0 40 1000" preserveAspectRatio="none">
            <path d="M22,0 C34,120 38,240 24,370 C16,480 32,580 22,700 C14,820 22,1000 22,1000 L40,1000 L40,0 Z" fill="var(--color-lavender-bg)" />
          </svg>
        )}

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden', background: 'var(--color-indigo-primary)' }}>
          {sidebarContent}
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-30 md:hidden"
            style={{ background: 'rgba(0,0,0,0.4)' }}
            onClick={() => setMobileOpen(false)}
          />
          <aside
            className="fixed inset-y-0 left-0 z-40 flex flex-col md:hidden transition-transform duration-200"
            style={{ width: 240, background: 'var(--color-indigo-primary)' }}
          >
            {sidebarContent}
          </aside>
        </>
      )}

      {/* Content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header
          className="md:hidden flex items-center gap-3 px-4 border-b shrink-0"
          style={{ height: 56, background: 'var(--color-white)', borderColor: 'var(--color-lavender-card)' }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            className="flex items-center justify-center w-8 h-8 rounded-lg"
            style={{ color: 'var(--color-text-primary)' }}
            aria-label="Menu openen"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <span className="font-bold" style={{ color: 'var(--color-indigo-primary)' }}>Opstap</span>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto px-4 py-8 md:px-8 max-w-4xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
