import Link from 'next/link'
import ThemeToggle from './ThemeToggle'
import SidebarNavLink from './SidebarNavLink'
import PublicMobileMenu from './PublicMobileMenu'
import LanguageSwitcherPublic from './LanguageSwitcherPublic'
import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'

export default async function PublicShell({ children }: { children: React.ReactNode }) {
  const t = await getTranslations('PublicShell')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userName = (user?.user_metadata?.naam as string | undefined)
    ?? user?.user_metadata?.full_name
    ?? user?.email
    ?? null

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--color-lavender-bg)' }}>

      {/* Fixed decorative blobs -stay in place while content scrolls */}
      <div aria-hidden style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', width: 500, height: 440, top: -80, right: -60, background: 'var(--color-indigo-primary)', opacity: 0.07, borderRadius: '62% 38% 46% 54% / 58% 44% 56% 42%', transform: 'rotate(-18deg)' }} />
        <div style={{ position: 'absolute', width: 420, height: 380, bottom: -100, right: 120, background: 'var(--color-indigo-primary)', opacity: 0.06, borderRadius: '38% 62% 54% 46% / 42% 58% 40% 60%', transform: 'rotate(22deg)' }} />
        <div style={{ position: 'absolute', width: 210, height: 230, top: '38%', right: '18%', background: 'var(--color-indigo-primary)', opacity: 0.04, borderRadius: '54% 46% 62% 38% / 40% 62% 38% 60%', transform: 'rotate(40deg)' }} />
      </div>

      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex shrink-0 h-full"
        style={{ width: 220, position: 'relative', zIndex: 2 }}
      >
        {/* Decorative background circles */}
        <svg aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }} viewBox="0 0 220 800" preserveAspectRatio="xMidYMid slice">
          <circle cx="195" cy="90" r="70" fill="rgba(255,255,255,0.06)" />
          <circle cx="175" cy="560" r="60" fill="rgba(255,255,255,0.05)" />
          <circle cx="205" cy="330" r="38" fill="rgba(255,255,255,0.04)" />
          <circle cx="140" cy="740" r="85" fill="rgba(255,255,255,0.03)" />
        </svg>

        {/* Organic right-edge wave -paints page bg over sidebar edge */}
        <svg aria-hidden style={{ position: 'absolute', top: 0, right: 0, width: 40, height: '100%', zIndex: 5, pointerEvents: 'none' }} viewBox="0 0 40 1000" preserveAspectRatio="none">
          <path d="M22,0 C34,120 38,240 24,370 C16,480 32,580 22,700 C14,820 22,1000 22,1000 L40,1000 L40,0 Z" fill="var(--color-lavender-bg)" />
        </svg>

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden', background: 'var(--color-indigo-primary)' }}>
          <div className="px-6 pt-8 pb-6">
            <Link href="/" className="font-bold text-xl text-white tracking-tight hover:opacity-90 transition">Opstap</Link>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>{t('slogan')}</p>
          </div>

          <nav className="flex-1 px-3 pr-10 flex flex-col gap-1">
            <SidebarNavLink href="/dashboard/profiel" label={t('navMijnProfiel')} />
            <SidebarNavLink href="/dashboard/settings" label={t('navInstellingen')} />
            <SidebarNavLink href="/dashboard" label={t('navVindVacatures')} />
            <SidebarNavLink href="/dashboard/sollicitaties" label={t('navJouwSollicitaties')} />
            <div className="my-2 mx-3 h-px" style={{ background: 'rgba(255,255,255,0.12)' }} />
            <SidebarNavLink href="/over-ons" label={t('navOverOpstap')} />
            <SidebarNavLink href="/faq" label={t('navHelpFaq')} />
            <SidebarNavLink href="/contact" label={t('navContact')} />
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
                style={{ background: 'rgba(255,255,255,0.22)', border: '1.5px solid rgba(255,255,255,0.7)' }}
              >
                {t('ctaAanDeSlag')}
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
          <LanguageSwitcherPublic />
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
              {t('mobileLoginButton')}
            </Link>
          )}
        </div>
      </div>

      {/* Page content -scrolls internally so sidebar stays fixed */}
      <main className="flex-1 flex flex-col overflow-auto pt-14 md:pt-0" style={{ position: 'relative', zIndex: 1 }}>
        {/* Desktop language switcher -top-right of content area, outside sidebar overflow:hidden */}
        <div className="hidden md:flex justify-end px-6 py-3">
          <LanguageSwitcherPublic />
        </div>
        {children}
      </main>

    </div>
  )
}
