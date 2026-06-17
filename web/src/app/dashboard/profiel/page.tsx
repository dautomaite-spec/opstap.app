'use client'

import { useState, useEffect, useRef } from 'react'
import { api, ApiError } from '@/lib/api'
import type { Profile, Application } from '@/lib/api'
import { JOB_TITLES } from '@/lib/jobTitles'
import Achievements from '../components/Achievements'

const OPLEIDINGSNIVEAU_LABELS: Record<string, string> = {
  vmbo: 'VMBO / Basis', mbo: 'MBO', hbo: 'HBO',
  wo_bachelor: 'WO Bachelor', wo_master: 'WO Master', phd: 'PhD / Promotie',
}

export default function ProfielPage() {
  const [tab, setTab] = useState<'gegevens' | 'prestaties'>('gegevens')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState('')

  const [cvUploading, setCvUploading] = useState(false)
  const [cvError, setCvError] = useState('')
  const [cvSuccess, setCvSuccess] = useState('')
  const [cvDeleting, setCvDeleting] = useState(false)
  const [cvConsentOpen, setCvConsentOpen] = useState(false)
  const [cvRetentionDays, setCvRetentionDays] = useState(30)
  const cvInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    Promise.all([
      api.profile.get().catch(() => null),
      api.apply.history().catch(() => []),
    ]).then(([p, apps]) => {
      setProfile(p)
      setApplications(apps as Application[])
    }).finally(() => setLoading(false))
  }, [])

  async function handleCvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCvUploading(true)
    setCvError('')
    setCvSuccess('')
    try {
      const res = await api.profile.uploadCV(file, cvRetentionDays)
      setCvSuccess(`CV geüpload. Wordt automatisch verwijderd op ${new Date(res.expires_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}.`)
      const updated = await api.profile.get().catch(() => null)
      if (updated) setProfile(updated)
    } catch (err) {
      setCvError(err instanceof ApiError ? err.message : 'Uploaden mislukt. Probeer opnieuw.')
    } finally {
      setCvUploading(false)
      if (cvInputRef.current) cvInputRef.current.value = ''
    }
  }

  async function handleCvDelete() {
    setCvDeleting(true)
    setCvError('')
    setCvSuccess('')
    try {
      await api.profile.deleteCV()
      setCvSuccess('CV verwijderd')
      setProfile(p => p ? { ...p, cv_url: undefined, cv_expires_at: undefined } : p)
    } catch (err) {
      setCvError(err instanceof ApiError ? err.message : 'Verwijderen mislukt.')
    } finally {
      setCvDeleting(false)
    }
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setSaveError('')
    setSaveSuccess(false)
    const fd = new FormData(e.currentTarget)
    try {
      const updated = await api.profile.update({
        naam: fd.get('naam') as string,
        functietitel: (fd.get('functietitel') as string) || undefined,
        functietitel_2: (fd.get('functietitel_2') as string) || undefined,
        functietitel_3: (fd.get('functietitel_3') as string) || undefined,
        woonplaats: (fd.get('woonplaats') as string) || undefined,
        uren_per_week: fd.get('uren_per_week') ? Number(fd.get('uren_per_week')) : undefined,
        beschikbaarheid: (fd.get('beschikbaarheid') as string) || undefined,
        werklocatie: (fd.get('werklocatie') as string) || undefined,
        opleidingsniveau: (fd.get('opleidingsniveau') as string) || undefined,
        extra_info: (fd.get('extra_info') as string) || undefined,
        leeftijd: fd.get('leeftijd') ? Number(fd.get('leeftijd')) : undefined,
        brief_taal: (fd.get('brief_taal') as string) || 'nl',
        salaris_min: fd.get('salaris_min') ? Number(fd.get('salaris_min')) : undefined,
        salaris_max: fd.get('salaris_max') ? Number(fd.get('salaris_max')) : undefined,
      })
      setProfile(updated)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Opslaan mislukt.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-24 text-sm" style={{ color: 'var(--color-text-muted)' }}>Laden…</div>
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-bold mb-6" style={{ color: 'var(--color-text-primary)' }}>Mijn profiel</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl" style={{ background: 'var(--color-lavender-card)' }}>
        {([['gegevens', 'Mijn gegevens'], ['prestaties', 'Prestaties']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="flex-1 py-2 text-sm font-medium rounded-lg transition"
            style={{
              background: tab === key ? 'var(--color-white)' : 'transparent',
              color: tab === key ? 'var(--color-indigo-primary)' : 'var(--color-text-muted)',
              boxShadow: tab === key ? '0 1px 4px rgba(61,58,140,0.1)' : 'none',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Gegevens tab */}
      {tab === 'gegevens' && (
        <>
          {profile && (() => {
            const fields = [profile.naam, profile.functietitel, profile.woonplaats, profile.uren_per_week, profile.werklocatie, profile.opleidingsniveau]
            const filled = fields.filter(Boolean).length
            const pct = Math.round((filled / 6) * 100)
            const complete = filled === 6
            return (
              <div className="mb-5 p-3 rounded-xl" style={{ background: 'var(--color-lavender-card)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>Profiel volledigheid</span>
                  <span className="text-xs font-semibold" style={{ color: complete ? '#16a34a' : 'var(--color-indigo-primary)' }}>
                    {filled}/6 {complete ? '· Compleet!' : ''}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-lavender-bg)' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: complete ? '#16a34a' : 'var(--color-indigo-primary)' }}
                  />
                </div>
                {!complete && !profile.profile_bonus_given && (
                  <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
                    Vul alle 6 velden in voor <strong style={{ color: 'var(--color-indigo-primary)' }}>+1 gratis credit</strong>.
                  </p>
                )}
              </div>
            )
          })()}
          {saveSuccess && (
            <p className="text-sm mb-4 px-3 py-2 rounded-lg" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success-text)' }}>
              Wijzigingen opgeslagen
            </p>
          )}
          {saveError && (
            <p className="text-sm mb-4 px-3 py-2 rounded-lg" style={{ background: 'var(--color-error-bg)', color: 'var(--color-error)' }}>
              {saveError}
            </p>
          )}
          {profile ? (
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <Field label="Volledige naam *" name="naam" required defaultValue={profile.naam} />
              <datalist id="job-titles-list">
                {JOB_TITLES.map(t => <option key={t} value={t} />)}
              </datalist>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Functietitel(s)</label>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  Voeg tot 3 rollen toe — Opstap zoekt en solliciteert voor al je titels.
                </p>
                <input list="job-titles-list" name="functietitel" placeholder="bijv. Software Developer" defaultValue={profile.functietitel ?? ''} className="px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: 'var(--color-lavender-card)', background: 'var(--color-lavender-bg)', color: 'var(--color-text-primary)' }} />
                <input list="job-titles-list" name="functietitel_2" placeholder="Tweede functietitel (optioneel)" defaultValue={profile.functietitel_2 ?? ''} className="px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: 'var(--color-lavender-card)', background: 'var(--color-lavender-bg)', color: 'var(--color-text-primary)' }} />
                <input list="job-titles-list" name="functietitel_3" placeholder="Derde functietitel (optioneel)" defaultValue={profile.functietitel_3 ?? ''} className="px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: 'var(--color-lavender-card)', background: 'var(--color-lavender-bg)', color: 'var(--color-text-primary)' }} />
              </div>
              <Field label="Woonplaats" name="woonplaats" placeholder="bijv. Amsterdam" defaultValue={profile.woonplaats} />
              <Field label="Uren per week" name="uren_per_week" type="number" placeholder="40" defaultValue={profile.uren_per_week?.toString()} />
              <SelectField label="Beschikbaarheid" name="beschikbaarheid" defaultValue={profile.beschikbaarheid ?? ''}>
                <option value="">Niet opgegeven</option>
                <option value="fulltime">Fulltime</option>
                <option value="parttime">Parttime</option>
                <option value="both">Fulltime of parttime</option>
              </SelectField>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Salaris (bruto/maand)</label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ color: 'var(--color-text-muted)' }}>€</span>
                    <input
                      name="salaris_min"
                      type="number"
                      min={0}
                      max={50000}
                      step={100}
                      placeholder="Min"
                      defaultValue={profile.salaris_min?.toString() ?? ''}
                      className="w-full pl-7 pr-3 py-2 rounded-lg border text-sm outline-none"
                      style={{ borderColor: 'var(--color-lavender-card)', background: 'var(--color-lavender-bg)', color: 'var(--color-text-primary)' }}
                    />
                  </div>
                  <span className="text-sm shrink-0" style={{ color: 'var(--color-text-muted)' }}>–</span>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ color: 'var(--color-text-muted)' }}>€</span>
                    <input
                      name="salaris_max"
                      type="number"
                      min={0}
                      max={50000}
                      step={100}
                      placeholder="Max"
                      defaultValue={profile.salaris_max?.toString() ?? ''}
                      className="w-full pl-7 pr-3 py-2 rounded-lg border text-sm outline-none"
                      style={{ borderColor: 'var(--color-lavender-card)', background: 'var(--color-lavender-bg)', color: 'var(--color-text-primary)' }}
                    />
                  </div>
                </div>
              </div>
              <SelectField label="Werklocatie" name="werklocatie" defaultValue={profile.werklocatie ?? ''}>
                <option value="">Geen voorkeur</option>
                <option value="op locatie">Op locatie</option>
                <option value="hybride">Hybride</option>
                <option value="remote">Thuis werken</option>
              </SelectField>
              <SelectField label="Opleidingsniveau" name="opleidingsniveau" defaultValue={profile.opleidingsniveau ?? ''}>
                <option value="">Niet opgegeven</option>
                <option value="vmbo">VMBO / Basis</option>
                <option value="mbo">MBO</option>
                <option value="hbo">HBO</option>
                <option value="wo_bachelor">WO Bachelor</option>
                <option value="wo_master">WO Master</option>
                <option value="phd">PhD / Promotie</option>
              </SelectField>

              {/* About me */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Over jezelf</label>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  Vertel iets over wie je bent — je hobby's, interesses, hoe jij werkt, wat je drijft. Hoe meer je deelt, hoe persoonlijker je motivatiebrief wordt.
                </p>
                <textarea
                  name="extra_info"
                  rows={5}
                  placeholder="Ik ben een enthousiaste teamspeler die graag met mensen werkt. In mijn vrije tijd speel ik voetbal en lees ik over technologie. Ik ben proactief, houd van uitdagingen en leer snel..."
                  defaultValue={profile.extra_info ?? ''}
                  maxLength={2000}
                  className="px-3 py-2 rounded-lg border text-sm outline-none resize-none"
                  style={{ borderColor: 'var(--color-lavender-card)', background: 'var(--color-lavender-bg)', color: 'var(--color-text-primary)' }}
                />
              </div>

              <div className="flex gap-3">
                <Field label="Leeftijd" name="leeftijd" type="number" placeholder="28" defaultValue={profile.leeftijd?.toString()} />
                <SelectField label="Taal motivatiebrief" name="brief_taal" defaultValue={profile.brief_taal ?? 'nl'}>
                  <option value="nl">Nederlands</option>
                  <option value="en">Engels</option>
                </SelectField>
              </div>

              {/* CV upload section */}
              <div className="pt-2 border-t" style={{ borderColor: 'var(--color-lavender-card)' }}>
                <p className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>CV uploaden</p>
                {cvError && (
                  <p className="text-xs mb-2 px-3 py-2 rounded-lg" style={{ background: 'var(--color-error-bg)', color: 'var(--color-error)' }}>{cvError}</p>
                )}
                {cvSuccess && (
                  <p className="text-xs mb-2 px-3 py-2 rounded-lg" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success-text)' }}>{cvSuccess}</p>
                )}
                {profile?.cv_url ? (
                  <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--color-lavender-card)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-indigo-primary)', flexShrink: 0 }}>
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>CV geüpload</p>
                      {profile.cv_expires_at && (
                        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          Vervalt {new Date(profile.cv_expires_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleCvDelete}
                      disabled={cvDeleting}
                      className="text-xs px-3 py-1.5 rounded-lg border transition hover:opacity-80 disabled:opacity-50"
                      style={{ borderColor: 'var(--color-error)', color: 'var(--color-error)' }}
                    >
                      {cvDeleting ? 'Verwijderen…' : 'Verwijder CV'}
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      ref={cvInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleCvUpload}
                      disabled={cvUploading}
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={cvUploading}
                      onClick={() => setCvConsentOpen(true)}
                      className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl border-2 border-dashed text-sm transition hover:opacity-80 disabled:opacity-50"
                      style={{ borderColor: 'var(--color-lavender-card)', color: 'var(--color-indigo-primary)' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      {cvUploading ? 'Uploaden…' : 'CV uploaden (PDF, DOC, DOCX)'}
                    </button>
                    <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
                      Nog geen CV?{' '}
                      <a
                        href="https://www.cvmaker.nl"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:opacity-70 transition"
                        style={{ color: 'var(--color-indigo-primary)' }}
                      >
                        Maak er gratis een via cvmaker.nl →
                      </a>
                    </p>
                  </div>
                )}

                {/* AVG consent modal */}
                {cvConsentOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
                    <div className="rounded-2xl p-6 max-w-sm w-full flex flex-col gap-4" style={{ background: 'var(--color-white)' }}>
                      <h3 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>CV uploaden</h3>
                      <div className="text-sm flex flex-col gap-2" style={{ color: 'var(--color-text-muted)' }}>
                        <p>Je CV wordt versleuteld opgeslagen en uitsluitend gebruikt voor het genereren van motivatiebrieven.</p>
                        <ul className="flex flex-col gap-1 pl-4 list-disc">
                          <li>Je ontvangt 7 dagen van tevoren een herinnering</li>
                          <li>Je kunt je CV op elk moment zelf verwijderen</li>
                          <li>Niet gedeeld met derden of gebruikt voor AI-training</li>
                        </ul>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>Bewaartermijn</label>
                        <select
                          value={cvRetentionDays}
                          onChange={e => setCvRetentionDays(Number(e.target.value))}
                          className="px-3 py-2 rounded-lg border text-sm"
                          style={{ borderColor: 'var(--color-lavender-card)', background: 'var(--color-lavender-bg)', color: 'var(--color-text-primary)' }}
                        >
                          <option value={7}>7 dagen</option>
                          <option value={30}>30 dagen (standaard)</option>
                          <option value={90}>90 dagen</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setCvConsentOpen(false)}
                          className="flex-1 py-2 rounded-xl text-sm border transition hover:opacity-80"
                          style={{ borderColor: 'var(--color-lavender-card)', color: 'var(--color-text-muted)' }}
                        >
                          Annuleren
                        </button>
                        <button
                          type="button"
                          onClick={() => { setCvConsentOpen(false); cvInputRef.current?.click() }}
                          className="flex-1 py-2 rounded-xl text-sm font-semibold text-white transition hover:opacity-90"
                          style={{ background: 'var(--color-indigo-primary)' }}
                        >
                          Akkoord en uploaden
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={saving}
                className="py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                style={{ background: 'var(--color-indigo-primary)' }}
              >
                {saving ? 'Opslaan…' : 'Opslaan'}
              </button>
            </form>
          ) : (
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Geen profiel gevonden.</p>
          )}
        </>
      )}

      {/* Prestaties tab */}
      {tab === 'prestaties' && (
        <Achievements profile={profile} applications={applications} />
      )}
    </div>
  )
}

function Field({ label, name, type = 'text', placeholder, required, defaultValue }: {
  label: string; name: string; type?: string; placeholder?: string; required?: boolean; defaultValue?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{label}</label>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        defaultValue={defaultValue}
        className="px-3 py-2 rounded-lg border text-sm outline-none"
        style={{ borderColor: 'var(--color-lavender-card)', background: 'var(--color-lavender-bg)', color: 'var(--color-text-primary)' }}
      />
    </div>
  )
}

function SelectField({ label, name, defaultValue, children }: {
  label: string; name: string; defaultValue: string; children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{label}</label>
      <select
        name={name}
        defaultValue={defaultValue}
        className="px-3 py-2 rounded-lg border text-sm"
        style={{ borderColor: 'var(--color-lavender-card)', background: 'var(--color-lavender-bg)', color: 'var(--color-text-primary)' }}
      >
        {children}
      </select>
    </div>
  )
}
