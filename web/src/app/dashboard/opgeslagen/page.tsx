'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import type { Job } from '@/lib/api'

const PENDING_APPLY_KEY = 'opstap_pending_apply'

const SAVED_JOBS_KEY = 'opstap_saved_jobs'

function loadSavedJobs(): Record<string, Job> {
  try {
    return JSON.parse(localStorage.getItem(SAVED_JOBS_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function removeSavedJob(id: string) {
  try {
    const map = loadSavedJobs()
    delete map[id]
    localStorage.setItem(SAVED_JOBS_KEY, JSON.stringify(map))
  } catch {
    // ignore
  }
}

export default function OpgeslagenPage() {
  const t = useTranslations('OpgeslagenPage')
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const map = loadSavedJobs()
    setJobs(Object.values(map))
    setReady(true)
  }, [])

  function handleUnsave(id: string) {
    removeSavedJob(id)
    setJobs(prev => prev.filter(j => j.id !== id))
  }

  function handleApply(job: Job) {
    localStorage.setItem(PENDING_APPLY_KEY, JSON.stringify(job))
    router.push('/dashboard')
  }

  if (!ready) {
    return <div className="flex items-center justify-center py-24 text-sm" style={{ color: 'var(--color-text-muted)' }}>{t('loading')}</div>
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{t('emptyStateMessage')}</p>
        <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>{t('emptyStateHint')}</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-baseline justify-between mb-6">
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{t('pageTitle')}</h1>
        <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{t('savedCount', { count: jobs.length })}</span>
      </div>
      <div className="flex flex-col gap-3">
        {jobs.map(job => (
          <div key={job.id} className="rounded-xl p-4" style={{ background: 'var(--color-lavender-card)' }}>
            <div className="flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>{job.title}</p>
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{job.company} · {job.location}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                  {job.salary_range && (
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {job.salary_range}
                      {job.salary_hourly && <span style={{ opacity: 0.75 }}> · {job.salary_hourly}</span>}
                    </span>
                  )}
                  {job.contract_type && (
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{job.contract_type}</span>
                  )}
                </div>
                {job.description_snippet && (
                  <p className="text-xs mt-2 line-clamp-2" style={{ color: 'var(--color-text-muted)' }}>{job.description_snippet}</p>
                )}
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <button
                  onClick={() => handleApply(job)}
                  className="px-3 py-1.5 text-xs rounded-lg text-white font-medium text-center transition hover:opacity-90"
                  style={{ background: 'var(--color-indigo-primary)' }}
                >
                  {t('applyButton')}
                </button>
                <a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-xs rounded-lg border text-center transition hover:opacity-80"
                  style={{ borderColor: 'var(--color-indigo-primary)', color: 'var(--color-indigo-primary)' }}
                >
                  {t('viewButton')}
                </a>
                <button
                  onClick={() => handleUnsave(job.id)}
                  className="px-3 py-1.5 text-xs rounded-lg border text-center transition hover:opacity-80"
                  style={{ borderColor: 'var(--color-lavender-card)', color: 'var(--color-text-muted)' }}
                >
                  {t('removeButton')}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
