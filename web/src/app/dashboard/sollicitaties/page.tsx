'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import type { Application } from '@/lib/api'

const STATUS_LABELS: Record<string, string> = {
  sent: 'Verstuurd',
  pending: 'In behandeling',
  rejected: 'Afgewezen',
  accepted: 'Geaccepteerd',
  replied: 'Beantwoord',
  failed: 'Mislukt',
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  sent: { bg: 'var(--color-lavender-bg)', color: 'var(--color-indigo-primary)' },
  pending: { bg: 'var(--color-lavender-bg)', color: 'var(--color-indigo-primary)' },
  replied: { bg: '#d1fae5', color: '#065f46' },
  accepted: { bg: '#d1fae5', color: '#065f46' },
  rejected: { bg: '#fee2e2', color: '#991b1b' },
  failed: { bg: '#fee2e2', color: '#991b1b' },
}

export default function SollicitatiesPage() {
  const [history, setHistory] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    api.apply.history()
      .then(setHistory)
      .finally(() => setLoading(false))
  }, [])

  async function handleStatusChange(app: Application, newStatus: string) {
    if (newStatus === app.status) return
    setUpdatingId(app.id)
    try {
      const updated = await api.apply.updateStatus(app.id, newStatus)
      setHistory(prev => prev.map(a => a.id === updated.id ? updated : a))
    } catch {
      // silently ignore — user can retry
    } finally {
      setUpdatingId(null)
    }
  }

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
        {history.map(app => {
          const statusStyle = STATUS_COLORS[app.status] ?? STATUS_COLORS.sent
          const isUpdating = updatingId === app.id
          const isFinal = app.status === 'failed'

          return (
            <div key={app.id} className="rounded-xl p-4" style={{ background: 'var(--color-lavender-card)' }}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>{app.job_title}</p>
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{app.company}</p>
                </div>
                {isFinal ? (
                  <span
                    className="text-xs px-2 py-1 rounded-full shrink-0"
                    style={{ background: statusStyle.bg, color: statusStyle.color }}
                  >
                    {STATUS_LABELS[app.status] ?? app.status}
                  </span>
                ) : (
                  <select
                    value={app.status}
                    disabled={isUpdating}
                    onChange={e => handleStatusChange(app, e.target.value)}
                    className="text-xs px-2 py-1 rounded-full border-0 shrink-0 cursor-pointer disabled:opacity-60"
                    style={{ background: statusStyle.bg, color: statusStyle.color, outline: 'none' }}
                  >
                    <option value="sent">Verstuurd</option>
                    <option value="pending">In behandeling</option>
                    <option value="replied">Beantwoord</option>
                    <option value="accepted">Geaccepteerd</option>
                    <option value="rejected">Afgewezen</option>
                  </select>
                )}
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

              <p className="text-xs mt-3" style={{ color: 'var(--color-text-muted)' }}>
                {new Date(app.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
                {app.replied_at && (
                  <span> · Beantwoord op {new Date(app.replied_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })}</span>
                )}
                {isUpdating && <span> · Opslaan…</span>}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
