'use client'

import { useState } from 'react'

interface FaqItem {
  q: string
  a: string
}

export default function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => (
        <div
          key={i}
          className="rounded-xl overflow-hidden"
          style={{ background: 'var(--color-white)', border: '1px solid var(--color-lavender-card)' }}
        >
          <button
            type="button"
            className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 text-sm font-semibold transition hover:opacity-80"
            style={{ color: 'var(--color-text-primary)' }}
            onClick={() => setOpen(open === i ? null : i)}
          >
            <span>{item.q}</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                flexShrink: 0,
                color: 'var(--color-indigo-primary)',
                transform: open === i ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
              }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {open === i && (
            <p
              className="px-5 pb-4 text-sm leading-relaxed"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {item.a}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
