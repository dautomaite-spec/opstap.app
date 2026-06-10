'use client'

import { useState, useEffect } from 'react'
import { api, ApiError } from '@/lib/api'
import type { Profile, Job } from '@/lib/api'

type ApplyState = { job: Job; letter: string; sending: boolean } | null

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

  const [applyState, setApplyState] = useState<ApplyState>(null)
  const [generatingLetter, setGeneratingLetter] = useState(false)
  const [applyError, setApplyError] = useState('')
  const [applySuccess, setApplySuccess] = useState('')
  const [writingStyle, setWritingStyle] = useState('formeel')
  const [sendMethod, setSendMethod] = useState<'email' | 'form'>('email')

  useEffect(() => {
    api.profile.get()
      .then(setProfile)
      .catch(() => setShowProfileForm(true))
      .finally(() => setProfileLoading(false))
  }, [])

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
      setApplyState({ job, letter: res.letter_nl, sending: false })
    } catch (err) {
      setApplyError(err instanceof ApiError ? err.message : 'Kon brief niet genereren.')
    } finally {
      setGeneratingLetter(false)
    }
  }

  async function handleSend() {
    if (!applyState || !profile) return
    setApplyState(s => s ? { ...s, sending: true } : s)
    setApplyError('')
    try {
      const { job } = applyState
      const result = await api.apply.send({ job_id: job.id, profile_id: profile.id, letter_nl: applyState.letter, send_method: sendMethod })
      if (sendMethod === 'form' || result.status === 'pending') {
        setApplySuccess(`Brief opgeslagen voor ${job.title}. Dien het formulier in via: ${job.url}`)
      } else {
        setApplySuccess(`Sollicitatie voor ${job.title} bij ${job.company} verstuurd!`)
      }
      setApplyState(null)
    } catch (err) {
      setApplyError(err instanceof ApiError ? err.message : 'Versturen mislukt.')
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
          <button
            onClick={() => setShowProfileForm(false)}
            className="text-xs underline ml-4 mt-1"
            style={{ color: 'var(--color-text-muted)' }}
          >
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
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 mb-6">
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
          className="w-full sm:w-48 px-3 py-2 rounded-lg border text-sm outline-none"
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

      {searchError && <p className="text-sm mb-4" style={{ color: 'var(--color-error)' }}>{searchError}</p>}
      {applySuccess && <p className="text-sm mb-4 px-3 py-2 rounded-lg" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success-text)' }}>{applySuccess}</p>}
      {applyError && <p className="text-sm mb-4" style={{ color: 'var(--color-error)' }}>{applyError}</p>}

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
            <div className="flex items-center gap-3 mt-4 mb-1">
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Versturen via:</span>
              <label className="flex items-center gap-1.5 text-xs cursor-pointer" style={{ color: 'var(--color-text-primary)' }}>
                <input type="radio" name="send_method" value="email" checked={sendMethod === 'email'} onChange={() => setSendMethod('email')} />
                E-mail
              </label>
              <label className="flex items-center gap-1.5 text-xs cursor-pointer" style={{ color: 'var(--color-text-primary)' }}>
                <input type="radio" name="send_method" value="form" checked={sendMethod === 'form'} onChange={() => setSendMethod('form')} />
                Webformulier
              </label>
            </div>
            <div className="flex gap-3 mt-3 justify-end">
              <button
                onClick={() => setApplyState(null)}
                className="px-4 py-2 text-sm rounded-lg border transition"
                style={{ borderColor: 'var(--color-lavender-card)', color: 'var(--color-text-muted)', background: 'var(--color-hover-surface)' }}
              >
                Annuleren
              </button>
              <button
                onClick={handleSend}
                disabled={applyState.sending}
                className="px-5 py-2 text-sm font-semibold rounded-lg text-white transition hover:opacity-90 disabled:opacity-50"
                style={{ background: 'var(--color-indigo-primary)' }}
              >
                {applyState.sending ? 'Versturen…' : 'Versturen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Job results */}
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
      <div className="flex flex-col gap-3">
        {jobs.map(job => (
          <div key={job.id} className="rounded-xl p-4 flex flex-col sm:flex-row sm:items-start gap-4" style={{ background: 'var(--color-lavender-card)' }}>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>{job.title}</p>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{job.company} · {job.location}</p>
              {job.salary_range && <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{job.salary_range}</p>}
              {job.description_snippet && (
                <p className="text-xs mt-2 line-clamp-2" style={{ color: 'var(--color-text-muted)' }}>{job.description_snippet}</p>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <a href={job.url} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 text-xs rounded-lg border transition hover:opacity-80" style={{ borderColor: 'var(--color-indigo-primary)', color: 'var(--color-indigo-primary)' }}>
                Bekijken
              </a>
              <button
                onClick={() => handleGenerateLetter(job)}
                disabled={generatingLetter || !profile}
                className="px-3 py-1.5 text-xs rounded-lg text-white font-medium transition hover:opacity-90 disabled:opacity-50"
                style={{ background: 'var(--color-indigo-primary)' }}
              >
                {generatingLetter ? 'Laden…' : 'Solliciteren'}
              </button>
            </div>
          </div>
        ))}
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
