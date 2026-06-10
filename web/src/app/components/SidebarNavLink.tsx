'use client'

import Link from 'next/link'

export default function SidebarNavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center px-3 py-2.5 rounded-lg text-sm transition"
      style={{ color: 'rgba(255,255,255,0.7)' }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.background = 'rgba(255,255,255,0.1)'
        el.style.color = 'white'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.background = 'transparent'
        el.style.color = 'rgba(255,255,255,0.7)'
      }}
    >
      {label}
    </Link>
  )
}
