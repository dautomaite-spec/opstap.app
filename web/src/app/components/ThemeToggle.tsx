'use client'

import { useTheme } from '@/lib/useTheme'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      suppressHydrationWarning
      aria-label={theme === 'dark' ? 'Schakel naar lichte modus' : 'Schakel naar donkere modus'}
      className="w-8 h-8 flex items-center justify-center rounded-lg border transition hover:opacity-80"
      style={{ borderColor: 'var(--color-lavender-card)', color: 'var(--color-text-muted)', background: 'var(--color-hover-surface)' }}
    >
      <span suppressHydrationWarning style={{ fontSize: '1rem', lineHeight: 1 }}>
        {theme === 'dark' ? '☀' : '☾'}
      </span>
    </button>
  )
}
