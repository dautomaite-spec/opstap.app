'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import type { Application } from '@/lib/api'
import type { Metadata } from 'next'

export default function SollicitatiesPage() {
  const [history, setHistory] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.apply.history()
      .then(setHistory)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <p className="text-sm text-center py-16" style={{ color: 'var(--color-text-muted)' }}>Laden…</p>
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Je hebt nog niet gesolliciteerd.</p>
        <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>Ga naar Vacatures om te beginnen.</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-6" style={{ color: 'var(--color-text-primary)' }}>Jouw reacties</h1>
      <div className="flex flex-col gap-3">
        {history.map(app => (
          <div key={app.id} className="rounded-xl p-4" style={{ background: 'var(--color-lavender-card)' }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>{app.job_title}</p>
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{app.company}</p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full shrink-0" style={{ background: 'var(--color-lavender-bg)', color: 'var(--color-indigo-primary)' }}>
                {({ sent: 'Verstuurd', pending: 'In behandeling', rejected: 'Afgewezen', accepted: 'Geaccepteerd' } as Record<string, string>)[app.status] ?? app.status}
              </span>
            </div>
            <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
              {new Date(app.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
