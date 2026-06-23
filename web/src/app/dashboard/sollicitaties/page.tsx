'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import type { Application } from '@/lib/api'

const STATUS_LABELS: Record<string, string> = {
  sent: 'Verstuurd',
  pending: 'In behandeling',
  rejected: 'Afgewezen',
  accepted: 'Aangenomen',
  replied: 'Beantwoord',
  interview: 'Uitgenodigd voor gesprek',
  failed: 'Mislukt',
  draft: 'Concept',
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  sent: { bg: 'var(--color-lavender-bg)', color: 'var(--color-indigo-primary)' },
  pending: { bg: 'var(--color-lavender-bg)', color: 'var(--color-indigo-primary)' },
  replied: { bg: '#d1fae5', color: '#065f46' },
  accepted: { bg: '#d1fae5', color: '#065f46' },
  interview: { bg: '#fef3c7', color: '#92400e' },
  rejected: { bg: '#fee2e2', color: '#991b1b' },
  failed: { bg: '#fee2e2', color: '#991b1b' },
  draft: { bg: '#f3f4f6', color: '#6b7280' },
}

interface Stats { sent: number; replied: number; interview: number; accepted: number }

export default function SollicitatiesPage() {
  const [history, setHistory] = useState<Application[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [retryingId, setRetryingId] = useState<string | null>(null)
  const [expandedLetter, setExpandedLetter] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      api.apply.history(),
      api.apply.stats(),
    ]).then(([rows, s]) => {
      setHistory(rows.filter(a => a.status !== 'draft'))
      setStats(s)
    }).finally(() => setLoading(false))
  }, [])

  async function handleStatusChange(app: Application, newStatus: string) {
    if (newStatus === app.status) return
    setUpdatingId(app.id)
    try {
      const updated = await api.apply.updateStatus(app.id, newStatus)
      setHistory(prev => prev.map(a => a.id === updated.id ? updated : a))
      setStats(prev => {
        if (!prev) return prev
        const next = { ...prev }
        if (app.status === 'sent' || app.status === 'pending') next.sent = Math.max(0, next.sent - 1)
        else if (app.status === 'replied') next.replied = Math.max(0, next.replied - 1)
        else if (app.status === 'interview') next.interview = Math.max(0, next.interview - 1)
        if (newStatus === 'sent' || newStatus === 'pending') next.sent += 1
        else if (newStatus === 'replied') next.replied += 1
        else if (newStatus === 'interview') next.interview += 1
        return next
      })
    } catch {
      // silently ignore — user can retry
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleRetry(app: Application) {
    setRetryingId(app.id)
    try {
      const updated = await api.apply.retry(app.id)
      setHistory(prev => prev.map(a => a.id === updated.id ? updated : a))
    } catch {
      // leave status as failed — user sees the button again
    } finally {
      setRetryingId(null)
    }
  }

  async function handleRating(app: Application, rating: 1 | -1) {
    if (app.letter_rating === rating) return
    setHistory(prev => prev.map(a => a.id === app.id ? { ...a, letter_rating: rating } : a))
    try {
      await api.apply.rateLetter(app.id, rating)
    } catch {
      setHistory(prev => prev.map(a => a.id === app.id ? { ...a, letter_rating: app.letter_rating } : a))
    }
  }

  if (loading) {
    return <p className="text-sm text-center py-16" style={{ color: 'var(--color-text-muted)' }}>Laden…</p>
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Je hebt nog niet gesolliciteerd.</p>
        <p className="text-xs mt-2 mb-6" style={{ color: 'var(--color-text-muted)' }}>Ga naar Vacatures om te beginnen.</p>
        <Link
          href="/dashboard"
          className="inline-block px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90"
          style={{ background: 'var(--color-indigo-primary)' }}
        >
          Zoek vacatures
        </Link>
      </div>
    )
  }

  const interviewCount = stats?.interview ?? 0

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Jouw sollicitaties</h1>
        {interviewCount > 0 && (
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: '#fef3c7', color: '#92400e' }}
          >
            {interviewCount} gesprek{interviewCount !== 1 ? 'ken' : ''}
          </span>
        )}
      </div>

      {/* Stats tiles */}
      {stats && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Verstuurd', value: stats.sent, color: 'var(--color-indigo-primary)', bg: 'var(--color-lavender-bg)' },
            { label: 'Beantwoord', value: stats.replied, color: '#065f46', bg: '#d1fae5' },
            { label: 'Gesprek', value: stats.interview, color: '#92400e', bg: '#fef3c7' },
          ].map(t => (
            <div key={t.label} className="rounded-xl p-3 text-center" style={{ background: t.bg }}>
              <p className="text-2xl font-bold" style={{ color: t.color }}>{t.value}</p>
              <p className="text-xs mt-0.5" style={{ color: t.color, opacity: 0.8 }}>{t.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {history.map(app => {
          const statusStyle = STATUS_COLORS[app.status] ?? STATUS_COLORS.sent
          const isUpdating = updatingId === app.id
          const isRetrying = retryingId === app.id
          const isFinal = app.status === 'failed' || app.status === 'accepted'

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
                    <option value="interview">Uitgenodigd voor gesprek</option>
                    <option value="accepted">Aangenomen</option>
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

              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-3">
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {new Date(app.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
                    {app.replied_at && (
                      <span> · Beantwoord op {new Date(app.replied_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })}</span>
                    )}
                    {isUpdating && <span> · Opslaan…</span>}
                  </p>
                  {app.status === 'failed' && (
                    <button
                      onClick={() => handleRetry(app)}
                      disabled={isRetrying}
                      className="text-xs px-2.5 py-1 rounded-lg font-medium transition hover:opacity-80 disabled:opacity-50"
                      style={{ background: 'var(--color-lavender-bg)', color: 'var(--color-indigo-primary)' }}
                    >
                      {isRetrying ? 'Bezig…' : 'Opnieuw'}
                    </button>
                  )}
                  {app.letter_nl && (
                    <button
                      onClick={() => setExpandedLetter(expandedLetter === app.id ? null : app.id)}
                      className="text-xs px-2.5 py-1 rounded-lg font-medium transition hover:opacity-80"
                      style={{ background: 'var(--color-lavender-bg)', color: 'var(--color-indigo-primary)' }}
                    >
                      {expandedLetter === app.id ? 'Verberg brief' : 'Bekijk brief'}
                    </button>
                  )}
                </div>
                {app.status === 'sent' && (
                  <div className="flex items-center gap-1">
                    <span className="text-xs mr-1" style={{ color: 'var(--color-text-muted)' }}>Brief:</span>
                    <button
                      title="Brief was goed"
                      onClick={() => handleRating(app, 1)}
                      className="p-1 rounded transition hover:bg-green-50"
                      style={{ color: app.letter_rating === 1 ? '#16a34a' : 'var(--color-text-muted)' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill={app.letter_rating === 1 ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
                    </button>
                    <button
                      title="Brief kon beter"
                      onClick={() => handleRating(app, -1)}
                      className="p-1 rounded transition hover:bg-red-50"
                      style={{ color: app.letter_rating === -1 ? '#dc2626' : 'var(--color-text-muted)' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill={app.letter_rating === -1 ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/><path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>
                    </button>
                  </div>
                )}
              </div>
              {expandedLetter === app.id && app.letter_nl && (
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
                  <p className="text-xs whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
                    {app.letter_nl}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
