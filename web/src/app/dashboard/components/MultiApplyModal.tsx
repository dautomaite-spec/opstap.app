'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { api, ApiError } from '@/lib/api'
import type { Job, Profile } from '@/lib/api'
import BuyCreditsModal from './BuyCreditsModal'

type EntryStatus = 'pending' | 'generating' | 'ready' | 'error' | 'sending' | 'sent' | 'failed'
type Phase = 'generating' | 'review' | 'sending' | 'done'

interface Entry {
  job: Job
  letter: string
  applicationId?: string
  status: EntryStatus
  error?: string
}

export default function MultiApplyModal({
  selectedJobs,
  profile,
  writingStyle,
  onClose,
}: {
  selectedJobs: Job[]
  profile: Profile
  writingStyle: string
  onClose: (sentCount: number) => void
}) {
  const t = useTranslations('MultiApplyModal')
  const [entries, setEntries] = useState<Entry[]>(
    selectedJobs.map(job => ({ job, letter: '', status: 'pending' }))
  )
  const [phase, setPhase] = useState<Phase>('generating')
  const [showBuyCredits, setShowBuyCredits] = useState(false)
  const [reviewIdx, setReviewIdx] = useState(0)
  const sentCountRef = useRef(0)

  // Auto-start generating on mount
  useEffect(() => {
    runGenerating(0, selectedJobs.map(job => ({ job, letter: '', status: 'pending' as EntryStatus })))
  }, [])

  async function runGenerating(idx: number, current: Entry[]) {
    if (idx >= current.length) {
      setPhase('review')
      return
    }
    const updated = current.map((e, i) => i === idx ? { ...e, status: 'generating' as EntryStatus } : e)
    setEntries([...updated])
    try {
      const res = await api.apply.generateLetter({
        job_id: updated[idx].job.id,
        profile_id: profile.id,
        writing_style: writingStyle,
      })
      const next = updated.map((e, i) => i === idx ? { ...e, letter: res.letter_nl, applicationId: res.application_id, status: 'ready' as EntryStatus } : e)
      setEntries([...next])
      await runGenerating(idx + 1, next)
    } catch (err) {
      if (err instanceof ApiError && err.status === 402) {
        const next = updated.map((e, i) =>
          i >= idx ? { ...e, status: 'error' as EntryStatus, error: i === idx ? t('errorInsufficientCredits') : t('errorSkipped') } : e
        )
        setEntries([...next])
        setShowBuyCredits(true)
        setPhase('review')
        return
      }
      const next = updated.map((e, i) => i === idx ? { ...e, status: 'error' as EntryStatus, error: t('errorGenerateFailed') } : e)
      setEntries([...next])
      await runGenerating(idx + 1, next)
    }
  }

  function updateLetter(idx: number, letter: string) {
    setEntries(prev => prev.map((e, i) => i === idx ? { ...e, letter } : e))
  }

  async function handleSendAll() {
    setPhase('sending')
    let sent = 0
    const snapshot = [...entries]

    for (let i = 0; i < snapshot.length; i++) {
      const entry = snapshot[i]
      if (entry.status !== 'ready') continue

      setEntries(prev => prev.map((e, j) => j === i ? { ...e, status: 'sending' } : e))
      try {
        if (entry.applicationId) {
          await api.apply.approve(entry.applicationId, { send_method: 'site', letter_nl: entry.letter })
        }
        window.open(entry.job.url, '_blank', 'noopener,noreferrer')
        setEntries(prev => prev.map((e, j) => j === i ? { ...e, status: 'sent' } : e))
        sent++
        await new Promise(r => setTimeout(r, 400))
      } catch {
        setEntries(prev => prev.map((e, j) => j === i ? { ...e, status: 'failed', error: t('errorSendFailed') } : e))
      }
    }

    sentCountRef.current = sent
    setPhase('done')
  }

  const readyCount = entries.filter(e => e.status === 'ready').length
  const doneGenerating = phase !== 'generating'
  const generatedCount = entries.filter(e => e.status === 'ready' || e.status === 'sent').length
  const totalCount = entries.length

  return (
    <>
      {showBuyCredits && <BuyCreditsModal onClose={() => setShowBuyCredits(false)} />}

      <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.45)' }}>
        <div className="w-full max-w-2xl rounded-2xl flex flex-col overflow-hidden" style={{ background: 'var(--color-white)', maxHeight: '90vh' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderColor: 'var(--color-lavender-card)' }}>
            <div>
              <h3 className="font-bold text-base" style={{ color: 'var(--color-text-primary)' }}>
                {phase === 'generating' && t('phaseGeneratingTitle')}
                {phase === 'review' && t('phaseReviewTitle')}
                {phase === 'sending' && t('phaseSendingTitle')}
                {phase === 'done' && t('phaseDoneTitle')}
              </h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                {phase === 'generating' && t('generatingProgress', { generatedCount, totalCount })}
                {phase === 'review' && (readyCount === 1 ? t('reviewSubtitleSingular', { readyCount }) : t('reviewSubtitlePlural', { readyCount }))}
                {(phase === 'sending' || phase === 'done') && t('sendingProgress', { sentCount: sentCountRef.current, readyCount })}
              </p>
            </div>
            {(phase === 'review' || phase === 'done') && (
              <button
                onClick={() => onClose(sentCountRef.current)}
                className="text-xs px-3 py-1.5 rounded-lg border transition hover:opacity-80"
                style={{ borderColor: 'var(--color-lavender-card)', color: 'var(--color-text-muted)' }}
              >
                {phase === 'done' ? t('closeButton') : t('cancelButton')}
              </button>
            )}
          </div>

          {/* Progress bar for generating */}
          {phase === 'generating' && (
            <div className="px-6 pt-3 shrink-0">
              <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'var(--color-lavender-bg)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${(generatedCount / totalCount) * 100}%`, background: 'var(--color-indigo-primary)' }}
                />
              </div>
            </div>
          )}

          {/* Entries list */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
            {phase === 'generating' && entries.map((entry, i) => (
              <div key={entry.job.id} className="flex items-center gap-3">
                <StatusIcon status={entry.status} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{entry.job.title}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>{entry.job.company}</p>
                </div>
                <span className="text-xs shrink-0" style={{ color: entry.error ? '#dc2626' : 'var(--color-text-muted)' }}>
                  {entry.status === 'pending' && t('statusPending')}
                  {entry.status === 'generating' && t('statusGenerating')}
                  {entry.status === 'ready' && t('statusReady')}
                  {entry.status === 'error' && (entry.error ?? t('statusErrorFallback'))}
                </span>
              </div>
            ))}

            {(phase === 'review' || phase === 'sending' || phase === 'done') && entries.map((entry, i) => (
              <div key={entry.job.id} className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--color-lavender-card)' }}>
                <div
                  className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
                  style={{ background: 'var(--color-lavender-card)' }}
                  onClick={() => setReviewIdx(reviewIdx === i ? -1 : i)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <StatusIcon status={entry.status} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{entry.job.title}</p>
                      <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>{entry.job.company}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    {entry.error && (
                      <span className="text-xs" style={{ color: '#dc2626' }}>{entry.error}</span>
                    )}
                    {entry.status === 'ready' && phase === 'review' && (
                      <svg
                        width="14" height="14"
                        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        style={{ color: 'var(--color-text-muted)', transform: reviewIdx === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    )}
                  </div>
                </div>
                {reviewIdx === i && entry.status === 'ready' && phase === 'review' && (
                  <div className="p-3">
                    <textarea
                      value={entry.letter}
                      onChange={e => updateLetter(i, e.target.value)}
                      rows={8}
                      className="w-full px-3 py-2 rounded-lg border text-sm resize-none outline-none"
                      style={{ borderColor: 'var(--color-lavender-card)', background: 'var(--color-lavender-bg)', color: 'var(--color-text-primary)' }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer actions */}
          {phase === 'review' && readyCount > 0 && (
            <div className="px-6 py-4 border-t shrink-0" style={{ borderColor: 'var(--color-lavender-card)' }}>
              <p className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>
                {t('footerInstructionText')}
              </p>
              <button
                onClick={handleSendAll}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90"
                style={{ background: 'var(--color-indigo-primary)' }}
              >
                {readyCount === 1 ? t('sendAllButtonSingular', { readyCount }) : t('sendAllButtonPlural', { readyCount })}
              </button>
            </div>
          )}

          {phase === 'done' && (
            <div className="px-6 py-4 border-t shrink-0 text-center" style={{ borderColor: 'var(--color-lavender-card)' }}>
              <p className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                {t('doneSummary', { sentCount: sentCountRef.current, readyCount })}
              </p>
              <button
                onClick={() => onClose(sentCountRef.current)}
                className="px-8 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90"
                style={{ background: 'var(--color-indigo-primary)' }}
              >
                {t('closeButton')}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function StatusIcon({ status }: { status: EntryStatus }) {
  if (status === 'generating' || status === 'sending') {
    return (
      <svg className="animate-spin shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--color-indigo-primary)' }}>
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
    )
  }
  if (status === 'ready') {
    return (
      <div className="w-4 h-4 rounded-full shrink-0" style={{ background: 'var(--color-lavender-bg)', border: '2px solid var(--color-indigo-primary)' }} />
    )
  }
  if (status === 'sent') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" style={{ color: '#16a34a' }}>
        <polyline points="20 6 9 17 4 12" />
      </svg>
    )
  }
  if (status === 'error' || status === 'failed') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" style={{ color: '#dc2626' }}>
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    )
  }
  return (
    <div className="w-4 h-4 rounded-full shrink-0" style={{ background: 'var(--color-lavender-card)' }} />
  )
}
