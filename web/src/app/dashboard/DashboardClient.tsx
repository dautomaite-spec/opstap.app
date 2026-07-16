'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { api, ApiError } from '@/lib/api'
import type { Profile } from '@/lib/api'
import BuyCreditsModal from './components/BuyCreditsModal'
import { JOB_TITLES } from '@/lib/jobTitles'

type UrlLetterResult = {
  job_title: string
  company: string
  letter: string
  application_id: string
  job_id: string
}

function trackEvent(name: string) {
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).posthog?.capture(name)
  }
}

export default function DashboardClient() {
  const router = useRouter()
  const t = useTranslations('DashboardClient')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [showProfileForm, setShowProfileForm] = useState(false)
  const [profileError, setProfileError] = useState('')

  const [writingStyle, setWritingStyle] = useState('formeel')
  const [showBuyCredits, setShowBuyCredits] = useState(false)
  const [applySuccess, setApplySuccess] = useState('')

  // URL → letter state
  const [urlLetterInput, setUrlLetterInput] = useState('')
  const [urlLetterLoading, setUrlLetterLoading] = useState(false)
  const [urlLetterError, setUrlLetterError] = useState('')
  const [urlLetterResult, setUrlLetterResult] = useState<UrlLetterResult | null>(null)
  const [showTextFallback, setShowTextFallback] = useState(false)
  const [jobTextInput, setJobTextInput] = useState('')

  // Send state (approval gate)
  const [sendingSite, setSendingSite] = useState(false)
  const [emailApplyOpen, setEmailApplyOpen] = useState(false)
  const [recipientEmail, setRecipientEmail] = useState('')
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailSendError, setEmailSendError] = useState('')

  useEffect(() => {
    api.profile.get()
      .then(p => setProfile(p))
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

  function preventEnterSubmit(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') e.preventDefault()
  }

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
      setProfileError(t('profileSaveError'))
    }
  }

  function resetSendState() {
    setEmailApplyOpen(false)
    setRecipientEmail('')
    setEmailSendError('')
  }

  async function handleUrlLetter(e: React.FormEvent) {
    e.preventDefault()
    if (!urlLetterInput.trim()) return
    setUrlLetterLoading(true)
    setUrlLetterError('')
    setUrlLetterResult(null)
    setApplySuccess('')
    resetSendState()
    try {
      const res = await api.apply.fromUrl(urlLetterInput.trim(), writingStyle)
      setUrlLetterResult(res)
      trackEvent('Letter Generated')
    } catch (err) {
      if (err instanceof ApiError && err.code === 'fetch_blocked') {
        setShowTextFallback(true)
        setUrlLetterError('')
      } else if (err instanceof ApiError && err.status === 402) {
        setShowBuyCredits(true)
      } else {
        setUrlLetterError(err instanceof ApiError ? err.message : t('generalError'))
      }
    } finally {
      setUrlLetterLoading(false)
    }
  }

  async function handleTextFallback(e: React.FormEvent) {
    e.preventDefault()
    if (jobTextInput.trim().length < 200) {
      setUrlLetterError(t('pasteTextTooShort'))
      return
    }
    setUrlLetterLoading(true)
    setUrlLetterError('')
    setApplySuccess('')
    resetSendState()
    try {
      const res = await api.apply.fromUrl(urlLetterInput.trim(), writingStyle, jobTextInput.trim())
      setUrlLetterResult(res)
      setShowTextFallback(false)
      trackEvent('Letter Generated')
    } catch (err) {
      if (err instanceof ApiError && err.status === 402) {
        setShowBuyCredits(true)
      } else {
        setUrlLetterError(err instanceof ApiError ? err.message : t('generalError'))
      }
    } finally {
      setUrlLetterLoading(false)
    }
  }

  // Approve + send via the vacancy site: copy letter, register the send, open the page
  async function handleSendViaSite() {
    if (!urlLetterResult) return
    setSendingSite(true)
    setUrlLetterError('')
    try {
      await navigator.clipboard.writeText(urlLetterResult.letter).catch(() => {})
      await api.apply.approve(urlLetterResult.application_id, { send_method: 'site', letter_nl: urlLetterResult.letter })
      window.open(urlLetterInput.trim(), '_blank', 'noopener,noreferrer')
      trackEvent('Application Sent')
      setApplySuccess(t('applySuccessMessage', { jobTitle: urlLetterResult.job_title }))
      setUrlLetterResult(null)
      resetSendState()
    } catch (err) {
      setUrlLetterError(err instanceof ApiError ? err.message : t('generalError'))
    } finally {
      setSendingSite(false)
    }
  }

  // Approve + send via email to a recruiter address
  async function handleSendViaEmail() {
    if (!urlLetterResult || !recipientEmail) return
    setSendingEmail(true)
    setEmailSendError('')
    try {
      await api.apply.approve(urlLetterResult.application_id, {
        send_method: 'email',
        contact_email_override: recipientEmail,
        letter_nl: urlLetterResult.letter,
      })
      trackEvent('Application Sent')
      setApplySuccess(t('emailSendSuccessMessage', { email: recipientEmail }))
      setUrlLetterResult(null)
      resetSendState()
    } catch (err) {
      setEmailSendError(err instanceof ApiError ? err.message : t('emailSendErrorFallback'))
    } finally {
      setSendingEmail(false)
    }
  }

  if (profileLoading) {
    return <div className="flex items-center justify-center py-24 text-sm" style={{ color: 'var(--color-text-muted)' }}>{t('loadingState')}</div>
  }

  if (showProfileForm) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <div className="mb-1">
          <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>{t('profileFormTitle')}</h2>
        </div>
        <p className="text-sm mb-1" style={{ color: 'var(--color-text-muted)' }}>{t('profileFormSubtitle')}</p>
        <p className="text-xs mb-5" style={{ color: 'var(--color-text-muted)' }}>{t('profileFormRequiredNote')}</p>
        {profileError && <p className="text-sm mb-4 px-3 py-2 rounded-lg" style={{ background: 'var(--color-error-bg)', color: 'var(--color-error)' }}>{profileError}</p>}
        <form onSubmit={handleProfileSave} className="flex flex-col gap-4">
          <Field label={t('fieldLabelFullName')} name="naam" required />

          {/* Job titles */}
          <datalist id="db-job-titles">
            {JOB_TITLES.map(t => <option key={t} value={t} />)}
          </datalist>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{t('fieldLabelJobTitles')}</label>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {t('fieldLabelJobTitlesHint')}
            </p>
            <input list="db-job-titles" name="functietitel" required placeholder={t('placeholderJobTitle1')} onKeyDown={preventEnterSubmit} className="px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: 'var(--color-lavender-card)', background: 'var(--color-lavender-bg)', color: 'var(--color-text-primary)' }} />
            <input list="db-job-titles" name="functietitel_2" placeholder={t('placeholderJobTitle2')} onKeyDown={preventEnterSubmit} className="px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: 'var(--color-lavender-card)', background: 'var(--color-lavender-bg)', color: 'var(--color-text-primary)' }} />
            <input list="db-job-titles" name="functietitel_3" placeholder={t('placeholderJobTitle3')} onKeyDown={preventEnterSubmit} className="px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: 'var(--color-lavender-card)', background: 'var(--color-lavender-bg)', color: 'var(--color-text-primary)' }} />
          </div>

          <Field label={t('fieldLabelCity')} name="woonplaats" placeholder={t('placeholderCity')} />

          <div className="flex gap-3">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{t('fieldLabelHoursPerWeek')}</label>
              <select name="uren_per_week" className="px-3 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--color-lavender-card)', background: 'var(--color-lavender-bg)', color: 'var(--color-text-primary)' }}>
                <option value="">{t('hoursOptionNoPreference')}</option>
                <option value="16">{t('hoursOptionMax16')}</option>
                <option value="24">{t('hoursOption16to24')}</option>
                <option value="32">{t('hoursOption24to32')}</option>
                <option value="36">{t('hoursOption32to36')}</option>
                <option value="40">{t('hoursOption40')}</option>
              </select>
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{t('fieldLabelAvailability')}</label>
              <select name="beschikbaarheid" className="px-3 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--color-lavender-card)', background: 'var(--color-lavender-bg)', color: 'var(--color-text-primary)' }}>
                <option value="">{t('availabilityOptionNotSpecified')}</option>
                <option value="fulltime">{t('availabilityOptionFulltime')}</option>
                <option value="parttime">{t('availabilityOptionParttime')}</option>
                <option value="both">{t('availabilityOptionBoth')}</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{t('fieldLabelSalary')}</label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ color: 'var(--color-text-muted)' }}>€</span>
                <input name="salaris_min" type="number" min={0} max={50000} step={100} placeholder={t('salaryPlaceholderMin')} className="w-full pl-7 pr-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: 'var(--color-lavender-card)', background: 'var(--color-lavender-bg)', color: 'var(--color-text-primary)' }} />
              </div>
              <span className="text-sm shrink-0" style={{ color: 'var(--color-text-muted)' }}>–</span>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ color: 'var(--color-text-muted)' }}>€</span>
                <input name="salaris_max" type="number" min={0} max={50000} step={100} placeholder={t('salaryPlaceholderMax')} className="w-full pl-7 pr-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: 'var(--color-lavender-card)', background: 'var(--color-lavender-bg)', color: 'var(--color-text-primary)' }} />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{t('fieldLabelWorkLocation')}</label>
            <select name="werklocatie" className="px-3 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--color-lavender-card)', background: 'var(--color-lavender-bg)', color: 'var(--color-text-primary)' }}>
              <option value="">{t('workLocationNoPreference')}</option>
              <option value="op locatie">{t('workLocationOnSite')}</option>
              <option value="hybride">{t('workLocationHybrid')}</option>
              <option value="remote">{t('workLocationRemote')}</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{t('fieldLabelEducationLevel')}</label>
            <select name="opleidingsniveau" className="px-3 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--color-lavender-card)', background: 'var(--color-lavender-bg)', color: 'var(--color-text-primary)' }}>
              <option value="">{t('educationNotSpecified')}</option>
              <option value="vmbo">{t('educationVmbo')}</option>
              <option value="mbo">{t('educationMbo')}</option>
              <option value="hbo">{t('educationHbo')}</option>
              <option value="wo_bachelor">{t('educationWoBachelor')}</option>
              <option value="wo_master">{t('educationWoMaster')}</option>
              <option value="phd">{t('educationPhd')}</option>
            </select>
          </div>
          <button type="submit" className="py-2.5 rounded-xl text-sm font-semibold text-white mt-2 hover:opacity-90 transition" style={{ background: 'var(--color-indigo-primary)' }}>
            {t('saveAndContinueButton')}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-6" style={{ color: 'var(--color-text-primary)' }}>{t('pageTitle')}</h1>

      {/* Hero: paste a vacancy link — the primary flow. The user brings the
          job from wherever they already look; Opstap does the rest. */}
      <div className="mb-6 p-5 rounded-2xl" style={{ background: 'var(--color-lavender-card)' }}>
        <h2 className="text-base font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>{t('pasteLinkTitle')}</h2>
        <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>{t('pasteLinkSubtitle')}</p>
        <form onSubmit={handleUrlLetter} className="flex flex-col sm:flex-row gap-2">
          <input
            type="url"
            inputMode="url"
            value={urlLetterInput}
            onChange={e => {
              setUrlLetterInput(e.target.value)
              setShowTextFallback(false)
              setJobTextInput('')
            }}
            placeholder={t('urlLetterInputPlaceholder')}
            className="flex-1 px-3 py-2.5 rounded-xl border text-sm outline-none"
            style={{ borderColor: 'var(--color-indigo-light)', background: 'var(--color-white)', color: 'var(--color-text-primary)' }}
          />
          <select
            value={writingStyle}
            onChange={e => setWritingStyle(e.target.value)}
            aria-label={t('writingStyleLabel')}
            className="px-3 py-2.5 rounded-xl border text-sm shrink-0"
            style={{ borderColor: 'var(--color-indigo-light)', background: 'var(--color-white)', color: 'var(--color-text-primary)' }}
          >
            <option value="formeel">{t('writingStyleFormeel')}</option>
            <option value="informeel">{t('writingStyleInformeel')}</option>
            <option value="enthousiast">{t('writingStyleEnthousiast')}</option>
            <option value="luchtig">{t('writingStyleLuchtig')}</option>
          </select>
          <button
            type="submit"
            disabled={urlLetterLoading || !urlLetterInput.trim()}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50 shrink-0"
            style={{ background: 'var(--color-indigo-primary)' }}
          >
            {urlLetterLoading ? t('urlLetterGeneratingButton') : t('urlLetterGenerateButton')}
          </button>
        </form>
        {urlLetterError && (
          <p className="text-sm mt-2" style={{ color: 'var(--color-error)' }}>{urlLetterError}</p>
        )}
        {showTextFallback && !urlLetterResult && (
          <form onSubmit={handleTextFallback} className="mt-4 flex flex-col gap-2">
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{t('pasteTextFallbackHint')}</p>
            <textarea
              rows={8}
              value={jobTextInput}
              onChange={e => setJobTextInput(e.target.value)}
              placeholder={t('pasteTextFallbackPlaceholder')}
              className="px-3 py-2 rounded-lg border text-sm resize-none outline-none"
              style={{ borderColor: 'var(--color-lavender-card)', background: 'var(--color-lavender-bg)', color: 'var(--color-text-primary)' }}
            />
            <button
              type="submit"
              disabled={urlLetterLoading || !jobTextInput.trim()}
              className="self-start px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
              style={{ background: 'var(--color-indigo-primary)' }}
            >
              {urlLetterLoading ? t('urlLetterGeneratingButton') : t('pasteTextFallbackButton')}
            </button>
          </form>
        )}
        {urlLetterResult && (
          <div className="mt-4 flex flex-col gap-3">
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {t('urlLetterJobAtCompany', { job_title: urlLetterResult.job_title, company: urlLetterResult.company })}
            </p>
            <textarea
              rows={12}
              value={urlLetterResult.letter}
              onChange={e => setUrlLetterResult(r => r ? { ...r, letter: e.target.value } : r)}
              className="px-3 py-2 rounded-lg border text-sm resize-none outline-none"
              style={{ borderColor: 'var(--color-lavender-card)', background: 'var(--color-lavender-bg)', color: 'var(--color-text-primary)' }}
            />
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleSendViaSite}
                disabled={sendingSite}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                style={{ background: 'var(--color-indigo-primary)' }}
              >
                {sendingSite ? (
                  <span className="flex items-center gap-1.5">
                    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/><path d="M12 3a9 9 0 0 1 9 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>
                    {t('applyingButton')}
                  </span>
                ) : t('urlLetterCopyAndOpenButton')}
              </button>
              <button
                onClick={() => navigator.clipboard.writeText(urlLetterResult!.letter).catch(() => {})}
                className="px-3 py-2 rounded-lg text-sm border transition hover:opacity-80"
                style={{ borderColor: 'var(--color-indigo-light)', color: 'var(--color-indigo-primary)' }}
              >
                {t('urlLetterCopyOnlyButton')}
              </button>
            </div>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {t('urlLetterEditHint')}
            </p>

            {/* Email send section */}
            <div className="border-t pt-3" style={{ borderColor: 'var(--color-lavender-bg)' }}>
              <button
                onClick={() => { setEmailApplyOpen(v => !v); setEmailSendError('') }}
                className="text-xs flex items-center gap-1.5 transition hover:opacity-80"
                style={{ color: 'var(--color-indigo-primary)' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                {emailApplyOpen ? t('emailApplyToggleHide') : t('emailApplyToggleShow')}
              </button>
              {emailApplyOpen && (
                <div className="mt-2 flex flex-col gap-2">
                  {emailSendError && (
                    <p className="text-xs" style={{ color: 'var(--color-error)' }}>{emailSendError}</p>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={recipientEmail}
                      onChange={e => setRecipientEmail(e.target.value)}
                      placeholder={t('emailPlaceholder')}
                      className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none"
                      style={{ borderColor: 'var(--color-lavender-card)', background: 'var(--color-lavender-bg)', color: 'var(--color-text-primary)' }}
                    />
                    <button
                      onClick={handleSendViaEmail}
                      disabled={sendingEmail || !recipientEmail}
                      className="px-4 py-2 text-sm font-medium rounded-lg text-white transition hover:opacity-90 disabled:opacity-50"
                      style={{ background: 'var(--color-indigo-primary)' }}
                    >
                      {sendingEmail ? t('emailSendingButton') : t('emailSendButton')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Post-send confirmation + referral nudge */}
      {applySuccess && (
        <div className="mb-4 flex flex-col gap-2">
          <p className="text-sm px-3 py-2 rounded-lg" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success-text)' }}>{applySuccess}</p>
          {profile?.referral_code && (
            <div className="px-3 py-2.5 rounded-lg text-xs flex items-center justify-between gap-3" style={{ background: 'var(--color-lavender-card)' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>
                {t('referralNudge')}
              </span>
              <button
                onClick={() => navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://opstapapp.nl'}/register?ref=${profile.referral_code}`).catch(() => {})}
                className="shrink-0 text-xs px-3 py-1 rounded-lg font-medium transition hover:opacity-90"
                style={{ background: 'var(--color-indigo-primary)', color: 'white' }}
              >
                {t('referralCopyLinkButton')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Profile completeness nudge: a CV makes the letters concrete */}
      {profile && !profile.cv_url && !profile.cv_expires_at && (
        <a
          href="/dashboard/profiel"
          className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg text-xs transition hover:opacity-90"
          style={{ background: 'var(--color-lavender-card)', color: 'var(--color-indigo-primary)' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <span>{t('cvNudge')}</span>
        </a>
      )}

      {/* Fixed-position overlays */}
      {showBuyCredits && <BuyCreditsModal onClose={() => setShowBuyCredits(false)} />}
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
