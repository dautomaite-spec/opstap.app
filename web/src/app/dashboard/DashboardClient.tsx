'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { api, ApiError } from '@/lib/api'
import type { Profile, Job } from '@/lib/api'
import BuyCreditsModal from './components/BuyCreditsModal'
import MultiApplyModal from './components/MultiApplyModal'
import { JOB_TITLES } from '@/lib/jobTitles'

// localStorage is kept as a fast local cache; Supabase is the source of truth
const SAVED_JOBS_KEY = 'opstap_saved_jobs'

function loadSavedJobsLocal(): Record<string, Job> {
  try { return JSON.parse(localStorage.getItem(SAVED_JOBS_KEY) ?? '{}') } catch { return {} }
}
function writeSavedJobsLocal(map: Record<string, Job>) {
  localStorage.setItem(SAVED_JOBS_KEY, JSON.stringify(map))
}

type SortKey = 'match' | 'salary' | 'date'
type ApplyState = { job: Job; applicationId: string | null; letter: string; regenRemaining: number | null; sending: boolean; copied: boolean } | null

const PENDING_APPLY_KEY = 'opstap_pending_apply'

function trackEvent(name: string) {
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).posthog?.capture(name)
  }
}

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
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [showProfileForm, setShowProfileForm] = useState(false)
  const [profileError, setProfileError] = useState('')
  const autoSearched = useRef(false)

  const [keywords, setKeywords] = useState('')
  const [location, setLocation] = useState('')
  const [jobs, setJobs] = useState<Job[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [sortBy, setSortBy] = useState<SortKey>('match')

  const [savedJobs, setSavedJobs] = useState<Record<string, Job>>({})

  useEffect(() => {
    // Seed from localStorage immediately for instant UI, then sync from Supabase
    setSavedJobs(loadSavedJobsLocal())
    api.jobs.listSaved()
      .then(rows => {
        const map: Record<string, Job> = {}
        for (const r of rows) map[r.job_id] = r.job_data
        setSavedJobs(map)
        writeSavedJobsLocal(map)
      })
      .catch(() => { /* offline or not authed -local cache is fine */ })
  }, [])

  const toggleSave = useCallback((job: Job) => {
    setSavedJobs(prev => {
      const next = { ...prev }
      if (next[job.id]) {
        delete next[job.id]
        api.jobs.unsave(job.id).catch(() => {})
      } else {
        next[job.id] = job
        api.jobs.save(job.id, job).catch(() => {})
      }
      writeSavedJobsLocal(next)
      return next
    })
  }, [])

  const [jobsStale, setJobsStale] = useState(false)

  // Search flow: button-triggered, minimum 5s spinner
  const [minAnimDone, setMinAnimDone] = useState(false)
  const minAnimTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const LAST_SEARCH_KEY = 'opstap_last_search'
  const SEARCH_PERIOD_MS = 48 * 60 * 60 * 1000
  const lastSearched = typeof window !== 'undefined' ? Number(localStorage.getItem(LAST_SEARCH_KEY) ?? '0') : 0
  const searchPeriodExpired = Date.now() - lastSearched > SEARCH_PERIOD_MS

  // Sidebar filters
  const [filterContracts, setFilterContracts] = useState<string[]>([])
  const [filterCurveball, setFilterCurveball] = useState<boolean | null>(null)

  const [applyState, setApplyState] = useState<ApplyState>(null)
  const [generatingLetter, setGeneratingLetter] = useState(false)
  const [applyError, setApplyError] = useState('')
  const [applySuccess, setApplySuccess] = useState('')
  const [writingStyle, setWritingStyle] = useState('formeel')
  const [showBuyCredits, setShowBuyCredits] = useState(false)

  // Email apply state (inside single letter modal)
  const [emailApplyOpen, setEmailApplyOpen] = useState(false)
  const [recipientEmail, setRecipientEmail] = useState('')
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailSendSuccess, setEmailSendSuccess] = useState('')
  const [emailSendError, setEmailSendError] = useState('')

  // Multi-apply state
  const [multiSelect, setMultiSelect] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showMultiApply, setShowMultiApply] = useState(false)
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set())

  // URL → letter state
  const [urlLetterOpen, setUrlLetterOpen] = useState(false)
  const [urlLetterInput, setUrlLetterInput] = useState('')
  const [urlLetterLoading, setUrlLetterLoading] = useState(false)
  const [urlLetterError, setUrlLetterError] = useState('')
  const [urlLetterResult, setUrlLetterResult] = useState<{ job_title: string; company: string; letter: string } | null>(null)

  useEffect(() => {
    api.profile.get()
      .then(p => {
        setProfile(p)
        if (p.functietitel) setKeywords(p.functietitel)
        if (p.woonplaats) setLocation(p.woonplaats)
        // Pending apply from saved-jobs page -pass p directly (state not yet updated)
        try {
          const raw = localStorage.getItem(PENDING_APPLY_KEY)
          if (raw) {
            localStorage.removeItem(PENDING_APPLY_KEY)
            const job = JSON.parse(raw) as Job
            handleGenerateLetter(job, p)
          }
        } catch {
          // ignore corrupt localStorage
        }
      })
      .catch((err: unknown) => {
        // 404 = no profile yet → send to onboarding wizard
        if (err instanceof ApiError && err.status === 404) {
          router.replace('/dashboard/welkom')
        } else {
          setShowProfileForm(true)
        }
      })
      .finally(() => setProfileLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const sortedJobs = useMemo(() => {
    if (!jobs.length) return jobs
    const withScore = jobs.map(j => ({ job: j, score: matchScore(j, profile) }))
    if (sortBy === 'match') {
      return withScore.sort((a, b) => b.score - a.score).map(x => x.job)
    }
    if (sortBy === 'salary') {
      return withScore.sort((a, b) => parseSalary(b.job.salary_range) - parseSalary(a.job.salary_range)).map(x => x.job)
    }
    return [...jobs].sort((a, b) => {
      const da = new Date(a.posted_at ?? a.scraped_at).getTime()
      const db = new Date(b.posted_at ?? b.scraped_at).getTime()
      return db - da
    })
  }, [jobs, sortBy, profile])

  const filteredJobs = useMemo(() => {
    return sortedJobs.filter(job => {
      if (filterContracts.length > 0 && !filterContracts.includes(job.contract_type ?? '')) return false
      if (filterCurveball === true && !job.is_curveball) return false
      if (filterCurveball === false && job.is_curveball) return false
      return true
    })
  }, [sortedJobs, filterContracts, filterCurveball])

  async function handleProfileSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const data = {
      naam: fd.get('naam') as string,
      functietitel: (fd.get('functietitel') as string) || undefined,
      functietitel_2: (fd.get('functietitel_2') as string) || undefined,
      functietitel_3: (fd.get('functietitel_3') as string) || undefined,
      woonplaats: (fd.get('woonplaats') as string) || undefined,
      uren_per_week: fd.get('uren_per_week') ? Number(fd.get('uren_per_week')) : undefined,
      beschikbaarheid: (fd.get('beschikbaarheid') as string) || undefined,
      salaris_min: fd.get('salaris_min') ? Number(fd.get('salaris_min')) : undefined,
      salaris_max: fd.get('salaris_max') ? Number(fd.get('salaris_max')) : undefined,
      werklocatie: (fd.get('werklocatie') as string) || undefined,
      opleidingsniveau: (fd.get('opleidingsniveau') as string) || undefined,
    }
    try {
      const saved = await api.profile.create(data)
      setProfile(saved)
      setShowProfileForm(false)
      // Auto-search immediately after first profile creation so the user lands on results
      if (saved.functietitel) {
        setKeywords(saved.functietitel)
        if (saved.woonplaats) setLocation(saved.woonplaats)
        triggerSearch(saved.functietitel, saved.woonplaats ?? '')
      }
    } catch (err) {
      // Profile may already exist -fall back to update
      if (err instanceof ApiError && err.status === 409) {
        try {
          const saved = await api.profile.update(data)
          setProfile(saved)
          setShowProfileForm(false)
          return
        } catch {
          // fall through to error
        }
      }
      setProfileError('Opslaan mislukt. Probeer het opnieuw.')
    }
  }

  async function handleUrlLetter(e: React.FormEvent) {
    e.preventDefault()
    if (!urlLetterInput.trim()) return
    setUrlLetterLoading(true)
    setUrlLetterError('')
    setUrlLetterResult(null)
    try {
      const res = await api.apply.fromUrl(urlLetterInput.trim(), writingStyle)
      setUrlLetterResult(res)
    } catch (err) {
      setUrlLetterError(err instanceof ApiError ? err.message : 'Er is iets misgegaan.')
    } finally {
      setUrlLetterLoading(false)
    }
  }

  async function triggerSearch(kw: string, loc: string) {
    setSearching(true)
    setMinAnimDone(false)
    setSearchError('')
    setJobs([])
    setJobsStale(false)
    if (minAnimTimer.current) clearTimeout(minAnimTimer.current)
    minAnimTimer.current = setTimeout(() => setMinAnimDone(true), 5000)
    try {
      const { jobs: results, stale } = await api.jobs.searchWithStale({ keywords: kw || undefined, location: loc || undefined, limit: 15 })
      if (results.length < 3 && loc) {
        const { jobs: wider, stale: widerStale } = await api.jobs.searchWithStale({ keywords: kw || undefined, limit: 15 })
        setJobs(wider)
        setJobsStale(widerStale)
      } else {
        setJobs(results)
        setJobsStale(stale)
      }
      localStorage.setItem(LAST_SEARCH_KEY, String(Date.now()))
    } catch (err) {
      setSearchError(err instanceof ApiError ? err.message : 'Er is iets misgegaan. Probeer het opnieuw.')
      setMinAnimDone(true)
    } finally {
      setSearching(false)
    }
  }

  function handleNewSearch() {
    if (!profile) return
    const kw = profile.functietitel ?? ''
    const loc = profile.woonplaats ?? ''
    triggerSearch(kw, loc)
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    await triggerSearch(keywords, location)
  }

  async function handleGenerateLetter(job: Job, profileOverride?: Profile) {
    const activeProfile = profileOverride ?? profile
    if (!activeProfile) return
    setGeneratingLetter(true)
    setApplyError('')
    setApplySuccess('')
    try {
      const res = await api.apply.generateLetter({ job_id: job.id, profile_id: activeProfile.id, writing_style: writingStyle })
      setApplyState({ job, applicationId: res.application_id ?? null, letter: res.letter_nl, regenRemaining: res.regenerations_remaining ?? null, sending: false, copied: false })
      trackEvent('Letter Generated')
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
      await navigator.clipboard.writeText(applyState.letter).catch(() => {})
      if (applyState.applicationId) {
        await api.apply.approve(applyState.applicationId, { send_method: 'site', letter_nl: applyState.letter })
      }
      window.open(applyState.job.url, '_blank', 'noopener,noreferrer')
      trackEvent('Application Sent')
      setApplySuccess(`Brief gekopieerd en vacature geopend voor ${applyState.job.title}.`)
      setApplyState(null)
    } catch (err) {
      setApplyError(err instanceof ApiError ? err.message : 'Er is iets misgegaan.')
      setApplyState(s => s ? { ...s, sending: false } : s)
    }
  }

  async function handleSendViaEmail() {
    if (!applyState || !applyState.applicationId || !recipientEmail) return
    setSendingEmail(true)
    setEmailSendError('')
    setEmailSendSuccess('')
    try {
      await api.apply.approve(applyState.applicationId, {
        send_method: 'email',
        contact_email_override: recipientEmail,
        letter_nl: applyState.letter,
      })
      trackEvent('Application Sent')
      setEmailSendSuccess(`Sollicitatie verstuurd naar ${recipientEmail}.`)
      setApplyState(null)
      setEmailApplyOpen(false)
      setRecipientEmail('')
    } catch (err) {
      setEmailSendError(err instanceof ApiError ? err.message : 'Versturen mislukt.')
    } finally {
      setSendingEmail(false)
    }
  }

  function toggleJobSelect(jobId: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(jobId)) next.delete(jobId)
      else if (next.size < 5) next.add(jobId)
      return next
    })
  }

  function exitMultiSelect() {
    setMultiSelect(false)
    setSelectedIds(new Set())
  }

  function toggleExpand(jobId: string) {
    setExpandedJobs(prev => {
      const next = new Set(prev)
      if (next.has(jobId)) next.delete(jobId)
      else next.add(jobId)
      return next
    })
  }

  function jobAgeDays(job: Job): number {
    const ref = job.posted_at || job.scraped_at
    const ms = Date.now() - new Date(ref).getTime()
    return Math.floor(ms / 86_400_000)
  }

  if (profileLoading) {
    return <div className="flex items-center justify-center py-24 text-sm" style={{ color: 'var(--color-text-muted)' }}>Laden…</div>
  }

  if (showProfileForm) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <div className="mb-1">
          <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>Profiel aanmaken</h2>
        </div>
        <p className="text-sm mb-1" style={{ color: 'var(--color-text-muted)' }}>Vul je gegevens in zodat we de juiste vacatures en brieven voor je kunnen vinden.</p>
        <p className="text-xs mb-5" style={{ color: 'var(--color-text-muted)' }}>Velden met * zijn verplicht</p>
        {profileError && <p className="text-sm mb-4 px-3 py-2 rounded-lg" style={{ background: 'var(--color-error-bg)', color: 'var(--color-error)' }}>{profileError}</p>}
        <form onSubmit={handleProfileSave} className="flex flex-col gap-4">
          <Field label="Volledige naam *" name="naam" required />

          {/* Job titles */}
          <datalist id="db-job-titles">
            {JOB_TITLES.map(t => <option key={t} value={t} />)}
          </datalist>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Functietitel(s) *</label>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Voeg tot 3 rollen toe. Opstap zoekt voor al je titels.
            </p>
            <input list="db-job-titles" name="functietitel" required placeholder="bijv. Software Developer" className="px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: 'var(--color-lavender-card)', background: 'var(--color-lavender-bg)', color: 'var(--color-text-primary)' }} />
            <input list="db-job-titles" name="functietitel_2" placeholder="Tweede functietitel (optioneel)" className="px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: 'var(--color-lavender-card)', background: 'var(--color-lavender-bg)', color: 'var(--color-text-primary)' }} />
            <input list="db-job-titles" name="functietitel_3" placeholder="Derde functietitel (optioneel)" className="px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: 'var(--color-lavender-card)', background: 'var(--color-lavender-bg)', color: 'var(--color-text-primary)' }} />
          </div>

          <Field label="Woonplaats" name="woonplaats" placeholder="bijv. Amsterdam" />

          <div className="flex gap-3">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Uren per week</label>
              <select name="uren_per_week" className="px-3 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--color-lavender-card)', background: 'var(--color-lavender-bg)', color: 'var(--color-text-primary)' }}>
                <option value="">Geen voorkeur</option>
                <option value="16">Max 16 uur</option>
                <option value="24">16-24 uur</option>
                <option value="32">24-32 uur</option>
                <option value="36">32-36 uur</option>
                <option value="40">40 uur (fulltime)</option>
              </select>
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Beschikbaarheid</label>
              <select name="beschikbaarheid" className="px-3 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--color-lavender-card)', background: 'var(--color-lavender-bg)', color: 'var(--color-text-primary)' }}>
                <option value="">Niet opgegeven</option>
                <option value="fulltime">Fulltime</option>
                <option value="parttime">Parttime</option>
                <option value="both">Fulltime of parttime</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Salaris (bruto/maand)</label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ color: 'var(--color-text-muted)' }}>€</span>
                <input name="salaris_min" type="number" min={0} max={50000} step={100} placeholder="Min" className="w-full pl-7 pr-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: 'var(--color-lavender-card)', background: 'var(--color-lavender-bg)', color: 'var(--color-text-primary)' }} />
              </div>
              <span className="text-sm shrink-0" style={{ color: 'var(--color-text-muted)' }}>–</span>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ color: 'var(--color-text-muted)' }}>€</span>
                <input name="salaris_max" type="number" min={0} max={50000} step={100} placeholder="Max" className="w-full pl-7 pr-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: 'var(--color-lavender-card)', background: 'var(--color-lavender-bg)', color: 'var(--color-text-primary)' }} />
              </div>
            </div>
          </div>

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

      {/* Search trigger */}
      {jobs.length === 0 && !searching && (
        <div className="flex flex-col items-center gap-3 py-10">
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {profile?.functietitel
              ? `Zoeken voor: ${[profile.functietitel, profile.functietitel_2, profile.functietitel_3].filter(Boolean).join(', ')}${profile.woonplaats ? ` · ${profile.woonplaats}` : ''}`
              : 'Vul eerst je profiel in om te zoeken.'}
          </p>
          <button
            onClick={handleNewSearch}
            disabled={!profile?.functietitel}
            className="px-6 py-3 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
            style={{ background: 'var(--color-indigo-primary)' }}
          >
            Zoek naar nieuwe vacatures
          </button>
        </div>
      )}

      {/* Re-search button (shown above results) */}
      {jobs.length > 0 && !searching && (
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {profile?.functietitel} {profile?.woonplaats ? `· ${profile.woonplaats}` : ''}
          </span>
          <button
            onClick={handleNewSearch}
            className="text-xs px-3 py-1.5 rounded-lg transition hover:opacity-80"
            style={{ background: 'var(--color-lavender-card)', color: 'var(--color-indigo-primary)' }}
          >
            Zoek opnieuw
          </button>
        </div>
      )}

      {/* URL → letter shortcut */}
      <div className="mb-5">
        <button
          onClick={() => { setUrlLetterOpen(o => !o); setUrlLetterResult(null); setUrlLetterError('') }}
          className="text-xs underline"
          style={{ color: 'var(--color-indigo-primary)' }}
        >
          {urlLetterOpen ? 'Sluiten' : 'Heb je een vacature-URL? Plak hem hier →'}
        </button>
        {urlLetterOpen && (
          <div className="mt-3 p-4 rounded-xl" style={{ background: 'var(--color-lavender-card)' }}>
            <form onSubmit={handleUrlLetter} className="flex flex-col gap-3">
              <input
                value={urlLetterInput}
                onChange={e => setUrlLetterInput(e.target.value)}
                placeholder="https://nl.indeed.com/vacatures/..."
                className="px-3 py-2 rounded-lg border text-sm outline-none"
                style={{ borderColor: 'var(--color-lavender-card)', background: 'var(--color-lavender-bg)', color: 'var(--color-text-primary)' }}
              />
              <button
                type="submit"
                disabled={urlLetterLoading || !urlLetterInput.trim()}
                className="self-start px-5 py-2 rounded-lg text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                style={{ background: 'var(--color-indigo-primary)' }}
              >
                {urlLetterLoading ? 'Brief genereren…' : 'Genereer brief (1 credit)'}
              </button>
              {urlLetterError && (
                <p className="text-sm" style={{ color: 'var(--color-error)' }}>{urlLetterError}</p>
              )}
            </form>
            {urlLetterResult && (
              <div className="mt-4 flex flex-col gap-3">
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {urlLetterResult.job_title} bij {urlLetterResult.company}
                </p>
                <textarea
                  rows={12}
                  value={urlLetterResult.letter}
                  onChange={e => setUrlLetterResult(r => r ? { ...r, letter: e.target.value } : r)}
                  className="px-3 py-2 rounded-lg border text-sm resize-none outline-none"
                  style={{ borderColor: 'var(--color-lavender-card)', background: 'var(--color-lavender-bg)', color: 'var(--color-text-primary)' }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(urlLetterResult!.letter).catch(() => {})
                      window.open(urlLetterInput, '_blank', 'noopener,noreferrer')
                    }}
                    className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition hover:opacity-90"
                    style={{ background: 'var(--color-indigo-primary)' }}
                  >
                    Kopieer & open vacature
                  </button>
                  <button
                    onClick={() => navigator.clipboard.writeText(urlLetterResult!.letter).catch(() => {})}
                    className="px-3 py-2 rounded-lg text-sm border transition hover:opacity-80"
                    style={{ borderColor: 'var(--color-lavender-card)', color: 'var(--color-indigo-primary)' }}
                  >
                    Alleen kopiëren
                  </button>
                </div>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  Brief bewerken kan hierboven. Klik op "Kopieer & open vacature" om de brief te plakken in het sollicitatieformulier.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sidebar + results layout -only shown when results are ready */}
      {(filteredJobs.length > 0 || (sortedJobs.length > 0 && filterContracts.length > 0)) && (
        <div className="flex gap-5 items-start">
          {/* Filter sidebar */}
          <aside
            className="shrink-0 rounded-xl p-4 flex flex-col gap-5 hidden sm:flex"
            style={{ width: 180, background: 'var(--color-lavender-card)' }}
          >
            <div>
              <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Sorteren</p>
              <div className="flex flex-col gap-1">
                {(['match', 'salary', 'date'] as SortKey[]).map(key => (
                  <button
                    key={key}
                    onClick={() => setSortBy(key)}
                    className="text-xs text-left px-2 py-1.5 rounded-lg transition"
                    style={{
                      background: sortBy === key ? 'var(--color-indigo-primary)' : 'transparent',
                      color: sortBy === key ? 'white' : 'var(--color-text-muted)',
                      fontWeight: sortBy === key ? 600 : 400,
                    }}
                  >
                    {{ match: 'Beste match', salary: 'Salaris', date: 'Nieuwste' }[key]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Dienstverband</p>
              <div className="flex flex-col gap-1">
                {['Fulltime', 'Parttime', 'Tijdelijk', 'Vast'].map(ct => (
                  <label key={ct} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filterContracts.includes(ct)}
                      onChange={e => setFilterContracts(prev =>
                        e.target.checked ? [...prev, ct] : prev.filter(x => x !== ct)
                      )}
                      className="rounded"
                    />
                    <span className="text-xs" style={{ color: 'var(--color-text-primary)' }}>{ct}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Type</p>
              <div className="flex flex-col gap-1">
                {[{ label: 'Alles', val: null }, { label: 'Match', val: false }, { label: 'Andere richting', val: true }].map(opt => (
                  <button
                    key={String(opt.val)}
                    onClick={() => setFilterCurveball(opt.val)}
                    className="text-xs text-left px-2 py-1.5 rounded-lg transition"
                    style={{
                      background: filterCurveball === opt.val ? 'var(--color-indigo-primary)' : 'transparent',
                      color: filterCurveball === opt.val ? 'white' : 'var(--color-text-muted)',
                      fontWeight: filterCurveball === opt.val ? 600 : 400,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            {(filterContracts.length > 0 || filterCurveball !== null) && (
              <button
                onClick={() => { setFilterContracts([]); setFilterCurveball(null) }}
                className="text-xs underline text-left mt-1"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Filters wissen
              </button>
            )}
          </aside>

          {/* Jobs column */}
          <div className="flex-1 min-w-0">
            {/* Multi-select bar */}
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              {multiSelect ? (
                <>
                  <span className="text-xs font-medium" style={{ color: 'var(--color-indigo-primary)' }}>
                    {selectedIds.size}/5 geselecteerd
                  </span>
                  <button onClick={exitMultiSelect} className="text-xs underline" style={{ color: 'var(--color-text-muted)' }}>
                    Annuleren
                  </button>
                </>
              ) : (
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{filteredJobs.length} vacatures</span>
              )}
              <div className="ml-auto">
                <button
                  onClick={() => { setMultiSelect(m => !m); setSelectedIds(new Set()) }}
                  className="text-xs px-3 py-1 rounded-full transition"
                  style={{
                    background: multiSelect ? 'var(--color-indigo-primary)' : 'var(--color-lavender-card)',
                    color: multiSelect ? 'white' : 'var(--color-text-muted)',
                  }}
                >
                  Meerdere selecteren
                </button>
              </div>
            </div>
          </div>{/* end jobs column */}
        </div>/* end sidebar+results flex */
      )}

      {/* Profile completeness nudge -shown when CV is missing */}
      {profile && !profile.cv_url && !profile.cv_expires_at && (
        <a
          href="/dashboard/profiel"
          className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg text-xs transition hover:opacity-90"
          style={{ background: 'var(--color-lavender-card)', color: 'var(--color-indigo-primary)' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <span><strong>Voeg je CV toe</strong> voor sterkere, persoonlijkere brieven →</span>
        </a>
      )}
      {jobsStale && (
        <div className="mb-4 px-3 py-2 rounded-lg text-xs" style={{ background: '#fef3c7', color: '#92400e' }}>
          Vacatures worden vernieuwd op de achtergrond. Je ziet nu resultaten uit onze cache.
        </div>
      )}
      {searchError && <p className="text-sm mb-4" style={{ color: 'var(--color-error)' }}>{searchError}</p>}
      {applySuccess && (
        <div className="mb-4 flex flex-col gap-2">
          <p className="text-sm px-3 py-2 rounded-lg" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success-text)' }}>{applySuccess}</p>
          {profile?.referral_code && (
            <div className="px-3 py-2.5 rounded-lg text-xs flex items-center justify-between gap-3" style={{ background: 'var(--color-lavender-card)' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>
                Ken je iemand die ook op zoek is? Deel Opstap en jullie krijgen allebei <strong style={{ color: 'var(--color-text-primary)' }}>+3 credits</strong>.
              </span>
              <button
                onClick={() => navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://opstapapp.nl'}/register?ref=${profile.referral_code}`).catch(() => {})}
                className="shrink-0 text-xs px-3 py-1 rounded-lg font-medium transition hover:opacity-90"
                style={{ background: 'var(--color-indigo-primary)', color: 'white' }}
              >
                Kopieer link
              </button>
            </div>
          )}
        </div>
      )}
      {applyError && <p className="text-sm mb-4" style={{ color: 'var(--color-error)' }}>{applyError}</p>}

      {showBuyCredits && <BuyCreditsModal onClose={() => setShowBuyCredits(false)} />}

      {/* Multi-apply modal */}
      {showMultiApply && profile && (
        <MultiApplyModal
          selectedJobs={sortedJobs.filter(j => selectedIds.has(j.id))}
          profile={profile}
          writingStyle={writingStyle}
          onClose={(sentCount) => {
            setShowMultiApply(false)
            exitMultiSelect()
            if (sentCount > 0) setApplySuccess(`${sentCount} sollicitatie${sentCount !== 1 ? 's' : ''} verstuurd.`)
          }}
        />
      )}

      {/* Multi-select sticky bottom bar */}
      {multiSelect && selectedIds.size > 0 && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 px-5 py-3 rounded-2xl shadow-xl"
          style={{ background: 'var(--color-indigo-primary)' }}
        >
          <span className="text-sm text-white font-medium">
            {selectedIds.size} geselecteerd
          </span>
          <button
            onClick={() => setShowMultiApply(true)}
            className="px-4 py-1.5 rounded-xl text-sm font-semibold transition hover:opacity-90"
            style={{ background: 'white', color: 'var(--color-indigo-primary)' }}
          >
            Solliciteer → ({selectedIds.size} credits)
          </button>
        </div>
      )}

      {/* Letter modal */}
      {applyState && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="w-full max-w-lg rounded-2xl p-6 my-4 max-h-[90vh] overflow-y-auto" style={{ background: 'var(--color-white)' }}>
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
              {applyState.regenRemaining !== null && (
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {applyState.regenRemaining}× over
                </span>
              )}
            </div>
            <textarea
              value={applyState.letter}
              onChange={e => setApplyState(s => s ? { ...s, letter: e.target.value } : s)}
              rows={7}
              className="w-full px-3 py-2 rounded-lg border text-sm resize-none outline-none"
              style={{ borderColor: 'var(--color-lavender-card)', background: 'var(--color-lavender-bg)', color: 'var(--color-text-primary)' }}
            />
            {/* Email send section */}
            <div className="mt-3 border-t pt-3" style={{ borderColor: 'var(--color-lavender-card)' }}>
              <button
                onClick={() => { setEmailApplyOpen(v => !v); setEmailSendError(''); setEmailSendSuccess('') }}
                className="text-xs flex items-center gap-1.5 transition hover:opacity-80"
                style={{ color: 'var(--color-indigo-primary)' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                {emailApplyOpen ? 'Verbergen' : 'Stuur per e-mail naar recruiter'}
              </button>
              {emailApplyOpen && (
                <div className="mt-2 flex flex-col gap-2">
                  {emailSendSuccess && (
                    <p className="text-xs px-2 py-1.5 rounded-lg" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success-text)' }}>{emailSendSuccess}</p>
                  )}
                  {emailSendError && (
                    <p className="text-xs" style={{ color: 'var(--color-error)' }}>{emailSendError}</p>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={recipientEmail}
                      onChange={e => setRecipientEmail(e.target.value)}
                      placeholder="recruiter@bedrijf.nl"
                      className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none"
                      style={{ borderColor: 'var(--color-lavender-card)', background: 'var(--color-lavender-bg)', color: 'var(--color-text-primary)' }}
                    />
                    <button
                      onClick={handleSendViaEmail}
                      disabled={sendingEmail || !recipientEmail}
                      className="px-4 py-2 text-sm font-medium rounded-lg text-white transition hover:opacity-90 disabled:opacity-50"
                      style={{ background: 'var(--color-indigo-primary)' }}
                    >
                      {sendingEmail ? 'Versturen…' : 'Verstuur'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end mt-4">
              <button
                onClick={() => { setApplyState(null); setEmailApplyOpen(false); setRecipientEmail('') }}
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
                {applyState.sending ? 'Bezig…' : 'Kopieer & solliciteer via site'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Spinner -shown while searching or during 5s minimum animation */}
      {(searching || (jobs.length > 0 && !minAnimDone)) && (
        <div className="flex flex-col items-center gap-4 py-14">
          <svg
            className="animate-spin"
            width="40" height="40" viewBox="0 0 40 40" fill="none"
            style={{ color: 'var(--color-indigo-primary)' }}
          >
            <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="4" strokeOpacity="0.2" />
            <path d="M20 4a16 16 0 0 1 16 16" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          </svg>
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            AI zoekt vacatures voor je...
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Dit duurt 30-60 seconden
          </p>
        </div>
      )}

      {/* Empty state after search returned nothing */}
      {jobs.length === 0 && !searching && searchError && (
        <p className="text-sm text-center py-8" style={{ color: 'var(--color-error)' }}>{searchError}</p>
      )}
      {jobs.length === 0 && !searching && !searchError && sortedJobs.length === 0 && (
        <p className="text-sm text-center py-8" style={{ color: 'var(--color-text-muted)' }}>
          Geen vacatures gevonden. Probeer opnieuw te zoeken.
        </p>
      )}

      {/* Job cards */}
      <div className="flex flex-col gap-3">
        {filteredJobs.map(job => {
          const pct = matchScore(job, profile)
          const matchColor = pct >= 70 ? '#16a34a' : pct >= 40 ? '#d97706' : '#6b7280'
          const matchBg = pct >= 70 ? '#f0fdf4' : pct >= 40 ? '#fffbeb' : '#f9fafb'
          const postedDate = formatDate(job.posted_at)
          const ageDays = jobAgeDays(job)
          const isExpanded = expandedJobs.has(job.id)
          return (
            <div key={job.id} className="rounded-xl p-4" style={{ background: 'var(--color-lavender-card)' }}>
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap">
                    <p className="font-semibold text-sm truncate flex-1" style={{ color: 'var(--color-text-primary)' }}>{job.title}</p>
                    {job.is_curveball ? (
                      <span
                        title="Andere sector, maar jouw vaardigheden passen hier goed bij"
                        className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 cursor-help"
                        style={{ background: '#fff7ed', color: '#c2410c' }}
                      >
                        Andere richting
                      </span>
                    ) : profile && (
                      <span
                        title="Hoe goed de vacature past bij jouw functietitel en woonplaats"
                        className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 cursor-help"
                        style={{ background: matchBg, color: matchColor }}
                      >
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
                      <span className="text-xs" style={{ color: ageDays > 21 ? '#d97706' : 'var(--color-text-muted)' }}>
                        {ageDays > 21 ? `Geplaatst ${postedDate} (mogelijk verlopen)` : `Geplaatst ${postedDate}`}
                      </span>
                    )}
                  </div>
                  {job.match_reason && (
                    <p
                      className="text-xs mt-1.5 italic"
                      style={{ color: job.is_curveball ? '#c2410c' : 'var(--color-indigo-primary)', opacity: 0.9 }}
                    >
                      {job.match_reason}
                    </p>
                  )}
                  {job.description_snippet && (
                    <div className="mt-2">
                      <p className={`text-xs ${isExpanded ? '' : 'line-clamp-2'}`} style={{ color: 'var(--color-text-muted)' }}>
                        {job.description_snippet}
                      </p>
                      {job.description_snippet.length > 120 && (
                        <button
                          onClick={() => toggleExpand(job.id)}
                          className="text-xs mt-0.5 underline"
                          style={{ color: 'var(--color-indigo-primary)' }}
                        >
                          {isExpanded ? 'Minder' : 'Meer'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  {multiSelect ? (
                    <button
                      onClick={() => toggleJobSelect(job.id)}
                      className="w-8 h-8 rounded-lg border-2 flex items-center justify-center transition"
                      style={{
                        borderColor: selectedIds.has(job.id) ? 'var(--color-indigo-primary)' : 'var(--color-lavender-card)',
                        background: selectedIds.has(job.id) ? 'var(--color-indigo-primary)' : 'transparent',
                      }}
                    >
                      {selectedIds.has(job.id) && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleGenerateLetter(job)}
                      disabled={generatingLetter || !profile}
                      className="px-3 py-1.5 text-xs rounded-lg text-white font-medium transition hover:opacity-90 disabled:opacity-50"
                      style={{ background: 'var(--color-indigo-primary)' }}
                    >
                      {generatingLetter ? 'Laden…' : 'Solliciteren (1 credit)'}
                    </button>
                  )}
                  <div className="flex gap-1.5">
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-3 py-1.5 text-xs rounded-lg border text-center transition hover:opacity-80"
                      style={{ borderColor: 'var(--color-indigo-primary)', color: 'var(--color-indigo-primary)' }}
                    >
                      Bekijken
                    </a>
                    <button
                      onClick={() => toggleSave(job)}
                      title={savedJobs[job.id] ? 'Verwijder uit opgeslagen' : 'Opslaan'}
                      className="px-2 py-1.5 rounded-lg border transition hover:opacity-80"
                      style={{
                        borderColor: savedJobs[job.id] ? 'var(--color-indigo-primary)' : 'var(--color-lavender-card)',
                        background: savedJobs[job.id] ? 'var(--color-lavender-bg)' : 'transparent',
                        color: savedJobs[job.id] ? 'var(--color-indigo-primary)' : 'var(--color-text-muted)',
                      }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill={savedJobs[job.id] ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                    </button>
                  </div>
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
