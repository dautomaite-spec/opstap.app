import Link from 'next/link'
import ThemeToggle from './ThemeToggle'
import SidebarNavLink from './SidebarNavLink'
import PublicMobileMenu from './PublicMobileMenu'
import { createClient } from '@/lib/supabase/server'

export default async function PublicShell({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userName = (user?.user_metadata?.naam as string | undefined)
    ?? user?.user_metadata?.full_name
    ?? user?.email
    ?? null

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--color-lavender-bg)' }}>

      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col shrink-0 sticky top-0 h-screen"
        style={{ width: 220, background: 'var(--color-indigo-primary)', position: 'relative', overflow: 'hidden' }}
      >
        {/* Decorative background circles */}
        <svg aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }} viewBox="0 0 220 800" preserveAspectRatio="xMidYMid slice">
          <circle cx="195" cy="90" r="70" fill="rgba(255,255,255,0.06)" />
          <circle cx="175" cy="560" r="60" fill="rgba(255,255,255,0.05)" />
          <circle cx="205" cy="330" r="38" fill="rgba(255,255,255,0.04)" />
          <circle cx="140" cy="740" r="85" fill="rgba(255,255,255,0.03)" />
        </svg>

        {/* Organic right-edge wave — paints page bg over sidebar edge */}
        <svg aria-hidden style={{ position: 'absolute', top: 0, right: 0, width: 40, height: '100%', zIndex: 5, pointerEvents: 'none' }} viewBox="0 0 40 1000" preserveAspectRatio="none">
          <path d="M22,0 C34,120 38,240 24,370 C16,480 32,580 22,700 C14,820 22,1000 22,1000 L40,1000 L40,0 Z" fill="var(--color-lavender-bg)" />
        </svg>

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div className="px-6 pt-8 pb-6">
            <Link href="/" className="font-bold text-xl text-white tracking-tight hover:opacity-90 transition">Opstap</Link>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Meer kansen. Minder moeite.</p>
          </div>

          <nav className="flex-1 px-3 pr-10 flex flex-col gap-1">
            <SidebarNavLink href="/dashboard/profiel" label="Mijn profiel" />
            <SidebarNavLink href="/dashboard/settings" label="Instellingen" />
            <SidebarNavLink href="/dashboard" label="Vind vacatures" />
            <SidebarNavLink href="/dashboard/opgeslagen" label="Opgeslagen vacatures" />
            <div className="my-2 mx-3 h-px" style={{ background: 'rgba(255,255,255,0.12)' }} />
            <SidebarNavLink href="/dashboard/settings" label="Voorkeuren / instellingen" />
            <SidebarNavLink href="/over-ons" label="Over Opstap" />
            <SidebarNavLink href="/faq" label="Help & FAQ" />
            <SidebarNavLink href="/contact" label="Contact" />
          </nav>

          <div className="px-4 py-6 flex flex-col gap-3">
            <ThemeToggle />
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
                className="w-full text-center py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90"
                style={{ background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.25)' }}
              >
                Aan de slag
              </Link>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 border-b"
        style={{ background: 'var(--color-indigo-primary)', borderColor: 'rgba(255,255,255,0.1)' }}
      >
        <PublicMobileMenu userName={userName} />
        <Link href="/" className="font-bold text-white hover:opacity-90 transition">Opstap</Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {userName ? (
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: 'rgba(255,255,255,0.25)', color: 'white' }}
            >
              {userName.charAt(0).toUpperCase()}
            </div>
          ) : (
            <Link href="/login" className="text-xs font-semibold text-white px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.18)' }}>
              Inloggen
            </Link>
          )}
        </div>
      </div>

      {/* Page content */}
      <main className="flex-1 flex flex-col pt-14 md:pt-0">
        {children}
      </main>

    </div>
  )
}
