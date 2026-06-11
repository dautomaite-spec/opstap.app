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
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
              {app.job_location && (
                <span className="text-xs flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {app.job_location}
                </span>
              )}
              {app.job_salary && (
                <span className="text-xs flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  {app.job_salary}
                </span>
              )}
              {app.job_hours && (
                <span className="text-xs flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  {app.job_hours}
                </span>
              )}
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
