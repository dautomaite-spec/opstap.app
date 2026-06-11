'use client'

import { useState, useEffect, useMemo } from 'react'
import { api, ApiError } from '@/lib/api'
import type { Profile, Job } from '@/lib/api'
import BuyCreditsModal from './components/BuyCreditsModal'

type SortKey = 'match' | 'salary' | 'date'
type ApplyState = { job: Job; letter: string; sending: boolean; copied: boolean } | null

function matchScore(job: Job, profile: Profile | null): number {
  if (!profile) return 0
  let score = 0
  if (profile.functietitel) {
    const profileWords = profile.functietitel.toLowerCase().split(/\s+/)
    const jobText = (job.title + ' ' + (job.description_snippet ?? '')).toLowerCase()
    const matches = profileWords.filter(w => w.length > 2 && jobText.includes(w)).length
    score += Math.min(60, Math.round((matches / Math.max(profileWords.length, 1)) * 60))
  }
  if (profile.woonplaats && job.location) {
    const pl = profile.woonplaats.toLowerCase()
    const jl = job.location.toLowerCase()
    if (jl.includes(pl) || pl.includes(jl)) score += 25
    else if (jl === 'heel nederland' || jl.includes('nederland') || jl.includes('remote')) score += 15
  }
  if (profile.werklocatie && job.description_snippet) {
    const snippet = job.description_snippet.toLowerCase()
    const wl = profile.werklocatie.toLowerCase()
    if (wl === 'remote' && snippet.includes('thuis')) score += 15
    else if (wl === 'hybride' && snippet.includes('hybride')) score += 15
    else if (wl === 'op locatie' && !snippet.includes('remote')) score += 10
    else score += 5
  } else {
    score += 5
  }
  return Math.min(score, 99)
}

function parseSalary(range?: string): number {
  if (!range) return 0
  const match = range.match(/[\d.]+/)
  if (!match) return 0
  return parseInt(match[0].replace(/\./g, ''), 10)
}

function formatDate(iso?: string): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (isNaN(d.getTime())) return null
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
}

export default function DashboardClient({ userId, userEmail }: { userId: string; userEmail: string }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [showProfileForm, setShowProfileForm] = useState(false)
  const [profileError, setProfileError] = useState('')

  const [keywords, setKeywords] = useState('')
  const [location, setLocation] = useState('')
  const [jobs, setJobs] = useState<Job[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [sortBy, setSortBy] = useState<SortKey>('match')

  const [applyState, setApplyState] = useState<ApplyState>(null)
  const [generatingLetter, setGeneratingLetter] = useState(false)
  const [applyError, setApplyError] = useState('')
  const [applySuccess, setApplySuccess] = useState('')
  const [writingStyle, setWritingStyle] = useState('formeel')
  const [showBuyCredits, setShowBuyCredits] = useState(false)

  useEffect(() => {
    api.profile.get()
      .then(p => {
        setProfile(p)
        if (p.functietitel) setKeywords(p.functietitel)
        if (p.woonplaats) setLocation(p.woonplaats)
      })
      .catch(() => setShowProfileForm(true))
      .finally(() => setProfileLoading(false))
  }, [])

  const sortedJobs = useMemo(() => {
    if (!jobs.length) return jobs
    const withScore = jobs.map(j => ({ job: j, score: matchScore(j, profile) }))
    if (sortBy === 'match') {
      return withScore.sort((a, b) => b.score - a.score).map(x => x.job)
    }
    if (sortBy === 'salary') {
      return withScore.sort((a, b) => parseSalary(b.job.salary_range) - parseSalary(a.job.salary_range)).map(x => x.job)
    }
    // date: newest first
    return [...jobs].sort((a, b) => {
      const da = new Date(a.posted_at ?? a.scraped_at).getTime()
      const db = new Date(b.posted_at ?? b.scraped_at).getTime()
      return db - da
    })
  }, [jobs, sortBy, profile])

  async function handleProfileSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    try {
      const saved = await api.profile.create({
        naam: fd.get('naam') as string,
        functietitel: fd.get('functietitel') as string || undefined,
        woonplaats: fd.get('woonplaats') as string || undefined,
        uren_per_week: fd.get('uren_per_week') ? Number(fd.get('uren_per_week')) : undefined,
        werklocatie: fd.get('werklocatie') as string || undefined,
        opleidingsniveau: fd.get('opleidingsniveau') as string || undefined,
      })
      setProfile(saved)
      setShowProfileForm(false)
    } catch {
      setProfileError('Opslaan mislukt. Probeer het opnieuw.')
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearching(true)
    setSearchError('')
    setJobs([])
    try {
      const results = await api.jobs.search({ keywords: keywords || undefined, location: location || undefined, limit: 20 })
      setJobs(results)
    } catch (err) {
      setSearchError(err instanceof ApiError ? err.message : 'Er is iets misgegaan. Probeer het opnieuw.')
    } finally {
      setSearching(false)
    }
  }

  async function handleGenerateLetter(job: Job) {
    if (!profile) return
    setGeneratingLetter(true)
    setApplyError('')
    setApplySuccess('')
    try {
      const res = await api.apply.generateLetter({ job_id: job.id, profile_id: profile.id, writing_style: writingStyle })
      setApplyState({ job, letter: res.letter_nl, sending: false, copied: false })
    } catch (err) {
      if (err instanceof ApiError && err.status === 402) {
        setShowBuyCredits(true)
      } else {
        setApplyError(err instanceof ApiError ? err.message : 'Kon brief niet genereren.')
      }
    } finally {
      setGeneratingLetter(false)
    }
  }

  async function handleSendViasite() {
    if (!applyState || !profile) return
    setApplyState(s => s ? { ...s, sending: true } : s)
    setApplyError('')
    try {
      // Copy letter to clipboard
      await navigator.clipboard.writeText(applyState.letter).catch(() => {})
      // Record the application
      await api.apply.send({ job_id: applyState.job.id, profile_id: profile.id, letter_nl: applyState.letter, send_method: 'site' })
      // Open the job URL
      window.open(applyState.job.url, '_blank', 'noopener,noreferrer')
      setApplySuccess(`Brief gekopieerd en vacature geopend voor ${applyState.job.title}.`)
      setApplyState(null)
    } catch (err) {
      setApplyError(err instanceof ApiError ? err.message : 'Er is iets misgegaan.')
      setApplyState(s => s ? { ...s, sending: false } : s)
    }
  }

  if (profileLoading) {
    return <div className="flex items-center justify-center py-24 text-sm" style={{ color: 'var(--color-text-muted)' }}>Laden…</div>
  }

  if (showProfileForm) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <div className="flex items-start justify-between mb-1">
          <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>Profiel aanmaken</h2>
          <button onClick={() => setShowProfileForm(false)} className="text-xs underline ml-4 mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Overslaan
          </button>
        </div>
        <p className="text-sm mb-1" style={{ color: 'var(--color-text-muted)' }}>Vul je gegevens in zodat we de juiste vacatures en brieven voor je kunnen vinden.</p>
        <p className="text-xs mb-5" style={{ color: 'var(--color-text-muted)' }}>Velden met * zijn verplicht</p>
        {profileError && <p className="text-sm mb-4 px-3 py-2 rounded-lg" style={{ background: 'var(--color-error-bg)', color: 'var(--color-error)' }}>{profileError}</p>}
        <form onSubmit={handleProfileSave} className="flex flex-col gap-4">
          <Field label="Volledige naam *" name="naam" required />
          <Field label="Functietitel" name="functietitel" placeholder="bijv. Verpleegkundige, Developer" />
          <Field label="Woonplaats" name="woonplaats" placeholder="bijv. Amsterdam" />
          <Field label="Uren per week" name="uren_per_week" type="number" placeholder="40" />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Werklocatie</label>
            <select name="werklocatie" className="px-3 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--color-lavender-card)', background: 'var(--color-lavender-bg)', color: 'var(--color-text-primary)' }}>
              <option value="">Geen voorkeur</option>
              <option value="op locatie">Op locatie</option>
              <option value="hybride">Hybride</option>
              <option value="remote">Thuis werken</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Opleidingsniveau</label>
            <select name="opleidingsniveau" className="px-3 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--color-lavender-card)', background: 'var(--color-lavender-bg)', color: 'var(--color-text-primary)' }}>
              <option value="">Niet opgegeven</option>
              <option value="vmbo">VMBO / Basis</option>
              <option value="mbo">MBO</option>
              <option value="hbo">HBO</option>
              <option value="wo_bachelor">WO Bachelor</option>
              <option value="wo_master">WO Master</option>
              <option value="phd">PhD / Promotie</option>
            </select>
          </div>
          <button type="submit" className="py-2.5 rounded-xl text-sm font-semibold text-white mt-2 hover:opacity-90 transition" style={{ background: 'var(--color-indigo-primary)' }}>
            Opslaan en verder
          </button>
        </form>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-6" style={{ color: 'var(--color-text-primary)' }}>Vacatures</h1>

      {/* Search form */}
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          value={keywords}
          onChange={e => setKeywords(e.target.value)}
          placeholder="Functie of trefwoord"
          className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none"
          style={{ borderColor: 'var(--color-lavender-card)', background: 'var(--color-lavender-bg)', color: 'var(--color-text-primary)' }}
        />
        <input
          value={location}
          onChange={e => setLocation(e.target.value)}
          placeholder="Stad of regio"
          className="w-full sm:w-44 px-3 py-2 rounded-lg border text-sm outline-none"
          style={{ borderColor: 'var(--color-lavender-card)', background: 'var(--color-lavender-bg)', color: 'var(--color-text-primary)' }}
        />
        <button
          type="submit"
          disabled={searching}
          className="px-6 py-2 rounded-lg text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          style={{ background: 'var(--color-indigo-primary)' }}
        >
          {searching ? 'Zoeken…' : 'Zoeken'}
        </button>
      </form>

      {/* Sort bar — only shown when there are results */}
      {sortedJobs.length > 0 && (
        <div className="flex items-center gap-3 mb-5">
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Sorteren:</span>
          {(['match', 'salary', 'date'] as SortKey[]).map(key => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className="text-xs px-3 py-1 rounded-full transition"
              style={{
                background: sortBy === key ? 'var(--color-indigo-primary)' : 'var(--color-lavender-card)',
                color: sortBy === key ? 'white' : 'var(--color-text-muted)',
              }}
            >
              {{ match: 'Match %', salary: 'Salaris', date: 'Datum' }[key]}
            </button>
          ))}
          <span className="text-xs ml-auto" style={{ color: 'var(--color-text-muted)' }}>{sortedJobs.length} vacatures</span>
        </div>
      )}

      {searchError && <p className="text-sm mb-4" style={{ color: 'var(--color-error)' }}>{searchError}</p>}
      {applySuccess && <p className="text-sm mb-4 px-3 py-2 rounded-lg" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success-text)' }}>{applySuccess}</p>}
      {applyError && <p className="text-sm mb-4" style={{ color: 'var(--color-error)' }}>{applyError}</p>}

      {showBuyCredits && <BuyCreditsModal onClose={() => setShowBuyCredits(false)} />}

      {/* Letter modal */}
      {applyState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="w-full max-w-lg rounded-2xl p-6" style={{ background: 'var(--color-white)' }}>
            <h3 className="font-bold text-base mb-1" style={{ color: 'var(--color-text-primary)' }}>Motivatiebrief</h3>
            <p className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>{applyState.job.title} · {applyState.job.company}</p>
            <div className="flex items-center gap-3 mb-3">
              <select
                value={writingStyle}
                onChange={e => setWritingStyle(e.target.value)}
                className="px-3 py-1.5 rounded-lg border text-sm"
                style={{ borderColor: 'var(--color-lavender-card)', background: 'var(--color-lavender-bg)', color: 'var(--color-text-primary)' }}
              >
                <option value="formeel">Formeel</option>
                <option value="informeel">Informeel</option>
                <option value="enthousiast">Enthousiast</option>
                <option value="luchtig">Luchtig</option>
              </select>
              <button
                onClick={() => handleGenerateLetter(applyState.job)}
                disabled={generatingLetter}
                className="px-3 py-1.5 text-xs rounded-lg border transition disabled:opacity-50"
                style={{ borderColor: 'var(--color-lavender-card)', color: 'var(--color-text-muted)', background: 'var(--color-hover-surface)' }}
              >
                {generatingLetter ? 'Genereren…' : 'Opnieuw genereren'}
              </button>
            </div>
            <textarea
              value={applyState.letter}
              onChange={e => setApplyState(s => s ? { ...s, letter: e.target.value } : s)}
              rows={10}
              className="w-full px-3 py-2 rounded-lg border text-sm resize-none outline-none"
              style={{ borderColor: 'var(--color-lavender-card)', background: 'var(--color-lavender-bg)', color: 'var(--color-text-primary)' }}
            />
            <p className="text-xs mt-2 mb-4" style={{ color: 'var(--color-text-muted)' }}>
              De brief wordt gekopieerd naar je klembord. Plak hem in het sollicitatieformulier van het bedrijf.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setApplyState(null)}
                className="px-4 py-2 text-sm rounded-lg border transition"
                style={{ borderColor: 'var(--color-lavender-card)', color: 'var(--color-text-muted)', background: 'var(--color-hover-surface)' }}
              >
                Annuleren
              </button>
              <button
                onClick={handleSendViasite}
                disabled={applyState.sending}
                className="px-5 py-2 text-sm font-semibold rounded-lg text-white transition hover:opacity-90 disabled:opacity-50"
                style={{ background: 'var(--color-indigo-primary)' }}
              >
                {applyState.sending ? 'Bezig…' : 'Kopieer & Solliciteer via site'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty states */}
      {jobs.length === 0 && !searching && !searchError && keywords === '' && location === '' && (
        <p className="text-sm text-center py-16" style={{ color: 'var(--color-text-muted)' }}>
          Zoek naar vacatures om te beginnen.
        </p>
      )}
      {jobs.length === 0 && !searching && !searchError && (keywords !== '' || location !== '') && (
        <p className="text-sm text-center py-16" style={{ color: 'var(--color-text-muted)' }}>
          Geen vacatures gevonden. Probeer een ander trefwoord of een bredere locatie.
        </p>
      )}

      {/* Job cards */}
      <div className="flex flex-col gap-3">
        {sortedJobs.map(job => {
          const pct = matchScore(job, profile)
          const matchColor = pct >= 70 ? '#16a34a' : pct >= 40 ? '#d97706' : '#6b7280'
          const matchBg = pct >= 70 ? '#f0fdf4' : pct >= 40 ? '#fffbeb' : '#f9fafb'
          const postedDate = formatDate(job.posted_at)
          return (
            <div key={job.id} className="rounded-xl p-4" style={{ background: 'var(--color-lavender-card)' }}>
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap">
                    <p className="font-semibold text-sm truncate flex-1" style={{ color: 'var(--color-text-primary)' }}>{job.title}</p>
                    {profile && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ background: matchBg, color: matchColor }}>
                        {pct}% match
                      </span>
                    )}
                  </div>
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{job.company} · {job.location}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                    {job.salary_range && (
                      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {job.salary_range}
                        {job.salary_hourly && <span style={{ color: 'var(--color-text-muted)', opacity: 0.75 }}> · {job.salary_hourly}</span>}
                      </span>
                    )}
                    {job.contract_type && (
                      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{job.contract_type}</span>
                    )}
                    {postedDate && (
                      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Geplaatst {postedDate}</span>
                    )}
                  </div>
                  {job.description_snippet && (
                    <p className="text-xs mt-2 line-clamp-2" style={{ color: 'var(--color-text-muted)' }}>{job.description_snippet}</p>
                  )}
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => handleGenerateLetter(job)}
                    disabled={generatingLetter || !profile}
                    className="px-3 py-1.5 text-xs rounded-lg text-white font-medium transition hover:opacity-90 disabled:opacity-50"
                    style={{ background: 'var(--color-indigo-primary)' }}
                  >
                    {generatingLetter ? 'Laden…' : 'Solliciteren'}
                  </button>
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 text-xs rounded-lg border text-center transition hover:opacity-80"
                    style={{ borderColor: 'var(--color-indigo-primary)', color: 'var(--color-indigo-primary)' }}
                  >
                    Bekijken
                  </a>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Field({ label, name, type = 'text', placeholder, required }: { label: string; name: string; type?: string; placeholder?: string; required?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{label}</label>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="px-3 py-2 rounded-lg border text-sm outline-none"
        style={{ borderColor: 'var(--color-lavender-card)', background: 'var(--color-lavender-bg)', color: 'var(--color-text-primary)' }}
      />
    </div>
  )
}
