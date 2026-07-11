'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { api, ApiError } from '@/lib/api'
import type { Profile, Application } from '@/lib/api'
import { JOB_TITLES } from '@/lib/jobTitles'
import Achievements from '../components/Achievements'

const OPLEIDINGSNIVEAU_LABELS: Record<string, string> = {
  vmbo: 'VMBO / Basis', mbo: 'MBO', hbo: 'HBO',
  wo_bachelor: 'WO Bachelor', wo_master: 'WO Master', phd: 'PhD / Promotie',
}

export default function ProfielPage() {
  const t = useTranslations('ProfielPage')
  const [tab, setTab] = useState<'gegevens' | 'prestaties'>('gegevens')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [saveError, setSaveError] = useState('')

  const [summaryGenerating, setSummaryGenerating] = useState(false)
  const [summaryApproving, setSummaryApproving] = useState(false)
  const [summaryPolling, setSummaryPolling] = useState(false)
  const [summaryError, setSummaryError] = useState('')

  const [cvUploading, setCvUploading] = useState(false)
  const [cvError, setCvError] = useState('')
  const [cvSuccess, setCvSuccess] = useState('')
  const [cvDeleting, setCvDeleting] = useState(false)
  const [cvApplying, setCvApplying] = useState(false)
  const [cvApplySuccess, setCvApplySuccess] = useState('')
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
      // Profile may have just been created (dashboard quick-form) and the
      // backend generates the summary asynchronously — pick it up once ready.
      if (p && !p.job_search_summary) pollForSummary(p.job_search_summary)
    }).finally(() => setLoading(false))
  }, [])

  /** Backend regenerates the summary asynchronously after profile/CV changes —
   * poll briefly for the updated value instead of leaving the UI stale. */
  async function pollForSummary(previousSummary: string | undefined, attempts = 6, intervalMs = 3000) {
    setSummaryPolling(true)
    try {
      for (let i = 0; i < attempts; i++) {
        await new Promise(r => setTimeout(r, intervalMs))
        const fresh = await api.profile.get().catch(() => null)
        if (!fresh) continue
        setProfile(fresh)
        if (fresh.job_search_summary && fresh.job_search_summary !== previousSummary) return
      }
    } finally {
      setSummaryPolling(false)
    }
  }

  async function handleCvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCvUploading(true)
    setCvError('')
    setCvSuccess('')
    try {
      const res = await api.profile.uploadCV(file, cvRetentionDays)
      setCvSuccess(t('cvUploadSuccess', { date: new Date(res.expires_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }) }))
      const updated = await api.profile.get().catch(() => null)
      if (updated) setProfile(updated)
      // CV parsing + summary regeneration both run in the background — poll longer here
      pollForSummary(updated?.job_search_summary, 12, 3000)
    } catch (err) {
      setCvError(err instanceof ApiError ? err.message : t('cvUploadErrorFallback'))
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
      setCvSuccess(t('cvDeleteSuccess'))
      setProfile(p => p ? { ...p, cv_url: undefined, cv_expires_at: undefined } : p)
    } catch (err) {
      setCvError(err instanceof ApiError ? err.message : t('cvDeleteErrorFallback'))
    } finally {
      setCvDeleting(false)
    }
  }

  async function handleApplyCv() {
    setCvApplying(true)
    setCvError('')
    setCvApplySuccess('')
    try {
      const updated = await api.profile.applyCV()
      setProfile(updated)
      setCvApplySuccess(t('cvApplySuccess'))
      pollForSummary(updated.job_search_summary)
    } catch (err) {
      setCvError(err instanceof ApiError ? err.message : t('cvApplyErrorFallback'))
    } finally {
      setCvApplying(false)
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
        job_preferences: (fd.get('job_preferences') as string) || undefined,
        job_background: (fd.get('job_background') as string) || undefined,
        job_company_size: (fd.get('job_company_size') as string) || undefined,
        job_culture: (fd.get('job_culture') as string) || undefined,
        job_role_type: (fd.get('job_role_type') as string) || undefined,
        job_avoids: (fd.get('job_avoids') as string) || undefined,
        leeftijd: fd.get('leeftijd') ? Number(fd.get('leeftijd')) : undefined,
        brief_taal: (fd.get('brief_taal') as string) || 'nl',
        salaris_min: fd.get('salaris_min') ? Number(fd.get('salaris_min')) : undefined,
        salaris_max: fd.get('salaris_max') ? Number(fd.get('salaris_max')) : undefined,
      })
      setProfile(updated)
      setSaveSuccess(true)
      setIsDirty(false)
      pollForSummary(updated.job_search_summary)
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : t('saveErrorFallback'))
    } finally {
      setSaving(false)
    }
  }

  async function handleGenerateSummary() {
    setSummaryGenerating(true)
    setSummaryError('')
    try {
      const res = await api.profile.generateSearchSummary()
      setProfile(p => p ? { ...p, job_search_summary: res.summary, job_search_summary_approved_at: undefined } : p)
    } catch (err) {
      setSummaryError(err instanceof ApiError ? err.message : t('summaryErrorFallback'))
    } finally {
      setSummaryGenerating(false)
    }
  }

  async function handleApproveSummary() {
    setSummaryApproving(true)
    setSummaryError('')
    try {
      const res = await api.profile.approveSearchSummary()
      setProfile(p => p ? { ...p, job_search_summary_approved_at: res.approved_at } : p)
    } catch (err) {
      setSummaryError(err instanceof ApiError ? err.message : t('summaryErrorFallback'))
    } finally {
      setSummaryApproving(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-24 text-sm" style={{ color: 'var(--color-text-muted)' }}>{t('loadingState')}</div>
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-bold mb-6" style={{ color: 'var(--color-text-primary)' }}>{t('pageTitle')}</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl" style={{ background: 'var(--color-lavender-card)' }}>
        {([['gegevens', t('tabGegevens')], ['prestaties', t('tabPrestaties')]] as const).map(([key, label]) => (
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
            const fieldDefs: [unknown, string][] = [
              [profile.naam, 'Naam'],
              [profile.functietitel, 'Functietitel'],
              [profile.woonplaats, 'Woonplaats'],
              [profile.uren_per_week, 'Uren per week'],
              [profile.werklocatie, 'Werklocatie'],
              [profile.opleidingsniveau, 'Opleidingsniveau'],
            ]
            const filled = fieldDefs.filter(([v]) => !!v).length
            const missing = fieldDefs.filter(([v]) => !v).map(([, label]) => label)
            const pct = Math.round((filled / fieldDefs.length) * 100)
            const complete = filled === fieldDefs.length
            return (
              <div className="mb-5 p-3 rounded-xl" style={{ background: 'var(--color-lavender-card)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>{t('profileCompletenessLabel')}</span>
                  <span className="text-xs font-semibold" style={{ color: complete ? '#16a34a' : 'var(--color-indigo-primary)' }}>
                    {t('profileCompletenessCount', { filled })} {complete ? t('profileCompletenessComplete') : ''}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-lavender-bg)' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: complete ? '#16a34a' : 'var(--color-indigo-primary)' }}
                  />
                </div>
                {!complete && (
                  <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
                    {t('profileMissingFields', { missing: missing.join(', ') })}
                    {!profile.profile_bonus_given && (
                      <>{' '}<strong style={{ color: 'var(--color-indigo-primary)' }}>{t('profileCompletionBonus')}</strong></>
                    )}
                  </p>
                )}
              </div>
            )
          })()}
          {saveError && (
            <p className="text-sm mb-4 px-3 py-2 rounded-lg" style={{ background: 'var(--color-error-bg)', color: 'var(--color-error)' }}>
              {saveError}
            </p>
          )}
          {profile ? (
            <form onSubmit={handleSave} onChange={() => { setIsDirty(true); setSaveSuccess(false) }} className="flex flex-col gap-4">
              <Field label={t('fieldLabelNaam')} name="naam" required defaultValue={profile.naam} />
              <datalist id="job-titles-list">
                {JOB_TITLES.map(title => <option key={title} value={title} />)}
              </datalist>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{t('fieldLabelFunctietitels')}</label>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {t('functietitelsDescription')}
                </p>
                <input list="job-titles-list" name="functietitel" placeholder={t('functietitel1Placeholder')} defaultValue={profile.functietitel ?? ''} className="px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: 'var(--color-lavender-card)', background: 'var(--color-lavender-bg)', color: 'var(--color-text-primary)' }} />
                <input list="job-titles-list" name="functietitel_2" placeholder={t('functietitel2Placeholder')} defaultValue={profile.functietitel_2 ?? ''} className="px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: 'var(--color-lavender-card)', background: 'var(--color-lavender-bg)', color: 'var(--color-text-primary)' }} />
                <input list="job-titles-list" name="functietitel_3" placeholder={t('functietitel3Placeholder')} defaultValue={profile.functietitel_3 ?? ''} className="px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: 'var(--color-lavender-card)', background: 'var(--color-lavender-bg)', color: 'var(--color-text-primary)' }} />
              </div>
              <PreferencesField label={t('jobPreferencesLabel')} description={t('jobPreferencesDescription')} placeholder={t('jobPreferencesPlaceholder')} defaultValue={profile.job_preferences ?? ''} />

              {/* Richer search profile section */}
              <div className="pt-3 border-t" style={{ borderColor: 'var(--color-lavender-card)' }}>
                <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>{t('searchProfileSectionTitle')}</p>
                <p className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>{t('searchProfileSectionDesc')}</p>
                <div className="flex flex-col gap-4">
                  <LimitedTextarea label={t('backgroundLabel')} name="job_background" description={t('backgroundDesc')} placeholder={t('backgroundPlaceholder')} defaultValue={profile.job_background ?? ''} maxLength={400} rows={3} />
                  <SelectField label={t('companySizeLabel')} name="job_company_size" defaultValue={profile.job_company_size ?? ''}>
                    <option value="">{t('companySizeNone')}</option>
                    <option value="startup">{t('companySizeStartup')}</option>
                    <option value="scale-up">{t('companySizeScaleup')}</option>
                    <option value="mkb">{t('companySizeMkb')}</option>
                    <option value="corporaat">{t('companySizeCorporaat')}</option>
                    <option value="overheid">{t('companySizeOverheid')}</option>
                  </SelectField>
                  <SelectField label={t('cultureLabel')} name="job_culture" defaultValue={profile.job_culture ?? ''}>
                    <option value="">{t('cultureNone')}</option>
                    <option value="plat">{t('culturePlat')}</option>
                    <option value="hybride">{t('cultureHybride')}</option>
                    <option value="gestructureerd">{t('cultureGestructureerd')}</option>
                  </SelectField>
                  <SelectField label={t('roleTypeLabel')} name="job_role_type" defaultValue={profile.job_role_type ?? ''}>
                    <option value="">{t('roleTypeNone')}</option>
                    <option value="specialist">{t('roleTypeSpecialist')}</option>
                    <option value="teamlead">{t('roleTypeTeamlead')}</option>
                    <option value="manager">{t('roleTypeManager')}</option>
                    <option value="mixed">{t('roleTypeMixed')}</option>
                  </SelectField>
                  <LimitedTextarea label={t('avoidsLabel')} name="job_avoids" description={t('avoidsDesc')} placeholder={t('avoidsPlaceholder')} defaultValue={profile.job_avoids ?? ''} maxLength={300} rows={2} />
                </div>
              </div>

              <Field label={t('fieldLabelWoonplaats')} name="woonplaats" placeholder={t('woonplaatsPlaceholder')} defaultValue={profile.woonplaats} />
              <SelectField label={t('fieldLabelUrenPerWeek')} name="uren_per_week" defaultValue={profile.uren_per_week?.toString() ?? ''}>
                <option value="">{t('urenGeenVoorkeur')}</option>
                <option value="16">{t('urenMax16')}</option>
                <option value="24">{t('uren1624')}</option>
                <option value="32">{t('uren2432')}</option>
                <option value="36">{t('uren3236')}</option>
                <option value="40">{t('uren40')}</option>
              </SelectField>
              <SelectField label={t('fieldLabelBeschikbaarheid')} name="beschikbaarheid" defaultValue={profile.beschikbaarheid ?? ''}>
                <option value="">{t('beschikbaarheidNietOpgegeven')}</option>
                <option value="fulltime">{t('beschikbaarheidFulltime')}</option>
                <option value="parttime">{t('beschikbaarheidParttime')}</option>
                <option value="both">{t('beschikbaarheidBoth')}</option>
              </SelectField>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{t('fieldLabelSalaris')}</label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ color: 'var(--color-text-muted)' }}>€</span>
                    <input
                      name="salaris_min"
                      type="number"
                      min={0}
                      max={50000}
                      step={100}
                      placeholder={t('salarisMinPlaceholder')}
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
                      placeholder={t('salarisMaxPlaceholder')}
                      defaultValue={profile.salaris_max?.toString() ?? ''}
                      className="w-full pl-7 pr-3 py-2 rounded-lg border text-sm outline-none"
                      style={{ borderColor: 'var(--color-lavender-card)', background: 'var(--color-lavender-bg)', color: 'var(--color-text-primary)' }}
                    />
                  </div>
                </div>
              </div>
              <SelectField label={t('fieldLabelWerklocatie')} name="werklocatie" defaultValue={profile.werklocatie ?? ''}>
                <option value="">{t('werklocatieGeenVoorkeur')}</option>
                <option value="op locatie">{t('werklocatieOpLocatie')}</option>
                <option value="hybride">{t('werklocatieHybride')}</option>
                <option value="remote">{t('werklocatieRemote')}</option>
              </SelectField>
              <SelectField label={t('fieldLabelOpleidingsniveau')} name="opleidingsniveau" defaultValue={profile.opleidingsniveau ?? ''}>
                <option value="">{t('opleidingNietOpgegeven')}</option>
                <option value="vmbo">{t('opleidingVmbo')}</option>
                <option value="mbo">{t('opleidingMbo')}</option>
                <option value="hbo">{t('opleidingHbo')}</option>
                <option value="wo_bachelor">{t('opleidingWoBachelor')}</option>
                <option value="wo_master">{t('opleidingWoMaster')}</option>
                <option value="phd">{t('opleidingPhd')}</option>
              </SelectField>

              {/* About me */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{t('fieldLabelOverJezelf')}</label>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {t('overJezelfDescription')}
                </p>
                <textarea
                  name="extra_info"
                  rows={5}
                  placeholder={t('overJezelfPlaceholder')}
                  defaultValue={profile.extra_info ?? ''}
                  maxLength={2000}
                  className="px-3 py-2 rounded-lg border text-sm outline-none resize-none"
                  style={{ borderColor: 'var(--color-lavender-card)', background: 'var(--color-lavender-bg)', color: 'var(--color-text-primary)' }}
                />
              </div>

              <div className="flex gap-3">
                <Field label={t('fieldLabelLeeftijd')} name="leeftijd" type="number" placeholder="28" defaultValue={profile.leeftijd?.toString()} />
                <SelectField label={t('fieldLabelBriefTaal')} name="brief_taal" defaultValue={profile.brief_taal ?? 'nl'}>
                  <option value="nl">{t('briefTaalNl')}</option>
                  <option value="en">{t('briefTaalEn')}</option>
                </SelectField>
              </div>

              {/* CV upload section */}
              <div className="pt-2 border-t" style={{ borderColor: 'var(--color-lavender-card)' }}>
                <p className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>{t('cvSectionTitle')}</p>
                {cvError && (
                  <p className="text-xs mb-2 px-3 py-2 rounded-lg" style={{ background: 'var(--color-error-bg)', color: 'var(--color-error)' }}>{cvError}</p>
                )}
                {cvSuccess && (
                  <p className="text-xs mb-2 px-3 py-2 rounded-lg" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success-text)' }}>{cvSuccess}</p>
                )}
                {cvApplySuccess && (
                  <p className="text-xs mb-2 px-3 py-2 rounded-lg" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success-text)' }}>{cvApplySuccess}</p>
                )}
                {profile?.cv_url ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--color-lavender-card)' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-indigo-primary)', flexShrink: 0 }}>
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                          {profile.cv_parsed ? t('cvUploadedParsed') : t('cvUploadedProcessing')}
                        </p>
                        {profile.cv_expires_at && (
                          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                            {t('cvExpiresAt', { date: new Date(profile.cv_expires_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' }) })}
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
                        {cvDeleting ? t('cvDeletingButton') : t('cvDeleteButton')}
                      </button>
                    </div>
                    {profile.cv_parsed && (
                      <button
                        type="button"
                        onClick={handleApplyCv}
                        disabled={cvApplying}
                        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                        style={{ background: 'var(--color-indigo-primary)' }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                        </svg>
                        {cvApplying ? t('cvApplyingButton') : t('cvApplyButton')}
                      </button>
                    )}
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
                      {cvUploading ? t('cvUploadingButton') : t('cvUploadButton')}
                    </button>
                    <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
                      {t('cvNoCV')}{' '}
                      <a
                        href="https://www.cvmaker.nl"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:opacity-70 transition"
                        style={{ color: 'var(--color-indigo-primary)' }}
                      >
                        {t('cvMakerLink')}
                      </a>
                    </p>
                  </div>
                )}

                {/* AVG consent modal */}
                {cvConsentOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
                    <div className="rounded-2xl p-6 max-w-sm w-full flex flex-col gap-4" style={{ background: 'var(--color-white)' }}>
                      <h3 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>{t('consentModalTitle')}</h3>
                      <div className="text-sm flex flex-col gap-2" style={{ color: 'var(--color-text-muted)' }}>
                        <p>{t('consentModalBody')}</p>
                        <ul className="flex flex-col gap-1 pl-4 list-disc">
                          <li>{t('consentBullet1')}</li>
                          <li>{t('consentBullet2')}</li>
                          <li>{t('consentBullet3')}</li>
                          <li>{t('consentBullet4')}</li>
                        </ul>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>{t('consentRetentionLabel')}</label>
                        <select
                          value={cvRetentionDays}
                          onChange={e => setCvRetentionDays(Number(e.target.value))}
                          className="px-3 py-2 rounded-lg border text-sm"
                          style={{ borderColor: 'var(--color-lavender-card)', background: 'var(--color-lavender-bg)', color: 'var(--color-text-primary)' }}
                        >
                          <option value={7}>{t('retention7Days')}</option>
                          <option value={30}>{t('retention30Days')}</option>
                          <option value={90}>{t('retention90Days')}</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setCvConsentOpen(false)}
                          className="flex-1 py-2 rounded-xl text-sm border transition hover:opacity-80"
                          style={{ borderColor: 'var(--color-lavender-card)', color: 'var(--color-text-muted)' }}
                        >
                          {t('consentCancelButton')}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setCvConsentOpen(false); cvInputRef.current?.click() }}
                          className="flex-1 py-2 rounded-xl text-sm font-semibold text-white transition hover:opacity-90"
                          style={{ background: 'var(--color-indigo-primary)' }}
                        >
                          {t('consentAgreeButton')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={saving}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                style={{ background: saveSuccess && !isDirty ? '#16a34a' : 'var(--color-indigo-primary)' }}
              >
                {saving ? (
                  t('savingButton')
                ) : saveSuccess && !isDirty ? (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    {t('saveSuccess')}
                  </>
                ) : (
                  t('saveButton')
                )}
              </button>
            </form>
          ) : (
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{t('noProfileFound')}</p>
          )}
        </>
      )}

      {/* Prestaties tab */}
      {tab === 'prestaties' && (
        <Achievements profile={profile} applications={applications} />
      )}

      {/* AI search summary — always visible at the bottom regardless of active tab.
          Read-only: it explains the automated search, it isn't itself editable. */}
      {profile && (
        <div className="mt-8 pt-5 border-t" style={{ borderColor: 'var(--color-lavender-card)' }}>
          <p className="text-xs font-semibold mb-1" style={{ color: 'var(--color-indigo-primary)' }}>{t('summaryCardTitle')}</p>
          <p className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>{t('summaryHint')}</p>

          {summaryError && (
            <p className="text-xs mb-3 px-3 py-2 rounded-lg" style={{ background: 'var(--color-error-bg)', color: 'var(--color-error)' }}>{summaryError}</p>
          )}

          {profile.job_search_summary ? (
            <>
              <div className="mb-3 p-3 rounded-xl text-sm" style={{ background: 'var(--color-lavender-card)', color: 'var(--color-text-primary)', lineHeight: 1.6 }}>
                <p>{profile.job_search_summary}</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {profile.job_search_summary_approved_at ? (
                  <p className="text-xs font-medium flex items-center gap-1" style={{ color: '#16a34a' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    {t('summaryApproved', { date: new Date(profile.job_search_summary_approved_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }) })}
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleApproveSummary}
                    disabled={summaryApproving}
                    className="py-2 px-4 rounded-xl text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                    style={{ background: 'var(--color-indigo-primary)' }}
                  >
                    {summaryApproving ? t('summaryApproving') : t('summaryApproveButton')}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleGenerateSummary}
                  disabled={summaryGenerating}
                  className="py-2 px-4 rounded-xl text-xs font-semibold transition hover:opacity-90 disabled:opacity-50"
                  style={{ background: 'var(--color-lavender-card)', color: 'var(--color-indigo-primary)' }}
                >
                  {summaryGenerating ? t('summaryGeneratingButton') : t('summaryRegenerateButton')}
                </button>
              </div>
            </>
          ) : summaryPolling ? (
            <p className="text-sm flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
              {t('summaryGeneratingButton')}
            </p>
          ) : (
            <button
              type="button"
              onClick={handleGenerateSummary}
              disabled={summaryGenerating}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition hover:opacity-90 disabled:opacity-50"
              style={{ background: 'var(--color-lavender-card)', color: 'var(--color-indigo-primary)' }}
            >
              {summaryGenerating ? (
                <>
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                  {t('summaryGeneratingButton')}
                </>
              ) : t('summaryGenerateButton')}
            </button>
          )}
        </div>
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

function PreferencesField({ label, description, placeholder, defaultValue }: {
  label: string; description: string; placeholder: string; defaultValue: string
}) {
  const [count, setCount] = useState(defaultValue.length)
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{label}</label>
      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{description}</p>
      <textarea
        name="job_preferences"
        rows={3}
        placeholder={placeholder}
        defaultValue={defaultValue}
        maxLength={300}
        onChange={e => setCount(e.target.value.length)}
        className="px-3 py-2 rounded-lg border text-sm outline-none resize-none"
        style={{ borderColor: 'var(--color-lavender-card)', background: 'var(--color-lavender-bg)', color: 'var(--color-text-primary)' }}
      />
      <span className="text-xs text-right" style={{ color: count > 260 ? 'var(--color-error)' : 'var(--color-text-muted)' }}>
        {count}/300
      </span>
    </div>
  )
}

function LimitedTextarea({ label, name, description, placeholder, defaultValue, maxLength, rows }: {
  label: string; name: string; description?: string; placeholder: string; defaultValue: string; maxLength: number; rows: number
}) {
  const [count, setCount] = useState(defaultValue.length)
  const warn = Math.floor(maxLength * 0.87)
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{label}</label>
      {description && <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{description}</p>}
      <textarea
        name={name}
        rows={rows}
        placeholder={placeholder}
        defaultValue={defaultValue}
        maxLength={maxLength}
        onChange={e => setCount(e.target.value.length)}
        className="px-3 py-2 rounded-lg border text-sm outline-none resize-none"
        style={{ borderColor: 'var(--color-lavender-card)', background: 'var(--color-lavender-bg)', color: 'var(--color-text-primary)' }}
      />
      <span className="text-xs text-right" style={{ color: count > warn ? 'var(--color-error)' : 'var(--color-text-muted)' }}>
        {count}/{maxLength}
      </span>
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
