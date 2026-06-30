'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { api, ApiError } from '@/lib/api'
import { JOB_TITLES } from '@/lib/jobTitles'

const ONBOARDING_KEY = 'opstap_onboarding_done'

function markDone() {
  try { localStorage.setItem(ONBOARDING_KEY, '1') } catch {}
}

function trackEvent(name: string) {
  try { (window as { posthog?: { capture: (n: string) => void } }).posthog?.capture(name) } catch {}
}

type Step = 1 | 2 | 3

export default function WelkomPage() {
  const t = useTranslations('WelkomPage')
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState<Step>(1)

  // Silently redeem invite code if present in URL
  useEffect(() => {
    const invite = searchParams.get('invite')
    if (invite) {
      api.invite.redeem(invite).catch(() => {})
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Step 1 -profile
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  // Step 2 -CV
  const [uploadingCV, setUploadingCV] = useState(false)
  const [cvDone, setCvDone] = useState(false)
  const [cvError, setCvError] = useState('')
  const [showAvgConsent, setShowAvgConsent] = useState(false)
  const [retentionDays, setRetentionDays] = useState(30)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleProfileSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setSaveError('')
    const fd = new FormData(e.currentTarget)
    try {
      await api.profile.create({
        naam: fd.get('naam') as string,
        functietitel: (fd.get('functietitel') as string) || undefined,
        functietitel_2: (fd.get('functietitel_2') as string) || undefined,
        functietitel_3: (fd.get('functietitel_3') as string) || undefined,
        woonplaats: (fd.get('woonplaats') as string) || undefined,
        extra_info: (fd.get('extra_info') as string) || undefined,
      })
      trackEvent('Onboarding: Profile Saved')
      setStep(2)
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : t('saveErrorFallback'))
    } finally {
      setSaving(false)
    }
  }

  async function handleUploadCV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingCV(true)
    setCvError('')
    try {
      await api.profile.uploadCV(file, retentionDays)
      trackEvent('Onboarding: CV Uploaded')
      setCvDone(true)
      setTimeout(() => setStep(3), 800)
    } catch (err) {
      setCvError(err instanceof ApiError ? err.message : t('cvUploadErrorFallback'))
    } finally {
      setUploadingCV(false)
      e.target.value = ''
    }
  }

  function finish() {
    markDone()
    trackEvent('Onboarding: Completed')
    router.replace('/dashboard')
  }

  return (
    <div className="max-w-md mx-auto pt-4">

      {/* Progress indicator */}
      <div className="flex flex-col items-center gap-2 mb-8">
        <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>{t('progressLabel', { step })}</p>
        <div className="flex items-center gap-2">
          {([1, 2, 3] as Step[]).map(n => (
            <div
              key={n}
              className="rounded-full transition-all"
              style={{
                width: step === n ? 24 : 8,
                height: 8,
                background: step === n ? 'var(--color-indigo-primary)' : step > n ? 'var(--color-indigo-primary)' : 'var(--color-lavender-card)',
                opacity: step > n ? 0.4 : 1,
              }}
            />
          ))}
        </div>
      </div>

      {/* Step 1 -Profile */}
      {step === 1 && (
        <div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-indigo-primary)' }}>
            {t('step1Heading')}
          </h1>
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
            {t('step1Description')}
          </p>
          {saveError && (
            <p className="text-sm mb-4 px-3 py-2 rounded-lg" style={{ background: 'var(--color-error-bg)', color: 'var(--color-error)' }}>{saveError}</p>
          )}
          <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>{t('requiredFieldsNote')}</p>
          <form onSubmit={handleProfileSave} className="flex flex-col gap-4">
            <WField label={t('nameLabel')} name="naam" required placeholder={t('namePlaceholder')} />
            <datalist id="job-titles-list">
              {JOB_TITLES.map(title => <option key={title} value={title} />)}
            </datalist>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{t('jobTitleLabel')}</label>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('jobTitleHint')}</p>
              <input list="job-titles-list" name="functietitel" required placeholder={t('jobTitle1Placeholder')} className="px-3 py-2.5 rounded-lg border text-sm outline-none" style={{ borderColor: 'var(--color-lavender-card)', background: 'var(--color-lavender-bg)', color: 'var(--color-text-primary)' }} />
              <input list="job-titles-list" name="functietitel_2" placeholder={t('jobTitle2Placeholder')} className="px-3 py-2.5 rounded-lg border text-sm outline-none" style={{ borderColor: 'var(--color-lavender-card)', background: 'var(--color-lavender-bg)', color: 'var(--color-text-primary)' }} />
              <input list="job-titles-list" name="functietitel_3" placeholder={t('jobTitle3Placeholder')} className="px-3 py-2.5 rounded-lg border text-sm outline-none" style={{ borderColor: 'var(--color-lavender-card)', background: 'var(--color-lavender-bg)', color: 'var(--color-text-primary)' }} />
            </div>
            <WField label={t('locationLabel')} name="woonplaats" placeholder={t('locationPlaceholder')} />
            <WTextarea
              label={t('aboutLabel')}
              name="extra_info"
              hint={t('aboutHint')}
              placeholder={t('aboutPlaceholder')}
            />
            <button
              type="submit"
              disabled={saving}
              className="py-3 rounded-xl text-sm font-semibold text-white mt-2 transition hover:opacity-90 disabled:opacity-50"
              style={{ background: 'var(--color-indigo-primary)' }}
            >
              {saving ? t('savingButton') : t('nextButton')}
            </button>
          </form>
        </div>
      )}

      {/* Step 2 -CV */}
      {step === 2 && (
        <div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-indigo-primary)' }}>
            {t('step2Heading')}
          </h1>
          <p className="text-sm mb-2" style={{ color: 'var(--color-text-muted)' }}>
            {t('step2Description')}
          </p>
          <p className="text-xs mb-6" style={{ color: 'var(--color-text-muted)' }}>
            {t('step2PrivacyNote')}
          </p>

          {cvError && <p className="text-sm mb-4" style={{ color: 'var(--color-error)' }}>{cvError}</p>}

          {cvDone ? (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-4" style={{ background: 'var(--color-success-bg)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-success-text)' }}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <p className="text-sm font-medium" style={{ color: 'var(--color-success-text)' }}>{t('cvUploadedSuccess')}</p>
            </div>
          ) : (
            <>
              {/* AVG consent modal */}
              {showAvgConsent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
                  <div className="w-full max-w-md rounded-2xl p-6" style={{ background: 'var(--color-white)' }}>
                    <h3 className="font-bold text-base mb-3" style={{ color: 'var(--color-text-primary)' }}>{t('avgConsentHeading')}</h3>
                    <div className="text-sm mb-4 flex flex-col gap-2" style={{ color: 'var(--color-text-muted)' }}>
                      <p>{t('avgConsentBody1')}</p>
                      <ul className="flex flex-col gap-1 pl-4 list-disc">
                        <li>{t('avgConsentBullet1')}</li>
                        <li>{t('avgConsentBullet2')}</li>
                        <li>{t('avgConsentBullet3')}</li>
                      </ul>
                    </div>
                    <p className="text-sm mb-1 font-medium" style={{ color: 'var(--color-text-primary)' }}>{t('retentionLabel')}</p>
                    <select
                      value={retentionDays}
                      onChange={e => setRetentionDays(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border text-sm mb-4"
                      style={{ borderColor: 'var(--color-lavender-card)', background: 'var(--color-lavender-bg)', color: 'var(--color-text-primary)' }}
                    >
                      <option value={7}>{t('retention7Days')}</option>
                      <option value={30}>{t('retention30Days')}</option>
                      <option value={90}>{t('retention90Days')}</option>
                    </select>
                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={() => setShowAvgConsent(false)}
                        className="px-4 py-2 text-sm rounded-lg border hover:opacity-80 transition"
                        style={{ borderColor: 'var(--color-lavender-card)', color: 'var(--color-text-muted)' }}
                      >
                        {t('cancelButton')}
                      </button>
                      <button
                        onClick={() => { setShowAvgConsent(false); fileInputRef.current?.click() }}
                        className="px-5 py-2 text-sm font-semibold rounded-lg text-white transition hover:opacity-90"
                        style={{ background: 'var(--color-indigo-primary)' }}
                      >
                        {t('agreeButton')}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept=".pdf,.docx" className="hidden" onChange={handleUploadCV} />
              <button
                onClick={() => setShowAvgConsent(true)}
                disabled={uploadingCV}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50 mb-3"
                style={{ background: 'var(--color-indigo-primary)' }}
              >
                {uploadingCV ? t('uploadingButton') : t('uploadCvButton')}
              </button>
            </>
          )}

          <button
            onClick={() => { if (!cvDone) trackEvent('Onboarding: CV Skipped'); setStep(3) }}
            className="w-full py-3 rounded-xl text-sm font-medium border transition hover:opacity-80"
            style={{ borderColor: 'var(--color-lavender-card)', color: 'var(--color-text-muted)' }}
          >
            {cvDone ? t('nextButton') : t('skipButton')}
          </button>
        </div>
      )}

      {/* Step 3 -Ready */}
      {step === 3 && (
        <div className="text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'var(--color-lavender-card)' }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-indigo-primary)' }}>
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-3" style={{ color: 'var(--color-indigo-primary)' }}>
            {t('step3Heading')}
          </h1>
          <p className="text-sm mb-2" style={{ color: 'var(--color-text-muted)' }}>
            {t.rich('step3CreditsLine', {
              strong: (chunks) => <strong style={{ color: 'var(--color-text-primary)' }}>{chunks}</strong>
            })}
          </p>
          <p className="text-sm mb-8" style={{ color: 'var(--color-text-muted)' }}>
            {t('step3Instruction')}
          </p>
          <button
            onClick={finish}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white transition hover:opacity-90"
            style={{ background: 'var(--color-indigo-primary)' }}
          >
            {t('searchJobsButton')}
          </button>
        </div>
      )}
    </div>
  )
}

function WField({ label, name, required, placeholder }: {
  label: string; name: string; required?: boolean; placeholder?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{label}</label>
      <input
        name={name}
        required={required}
        placeholder={placeholder}
        className="px-3 py-2.5 rounded-lg border text-sm outline-none"
        style={{ borderColor: 'var(--color-lavender-card)', background: 'var(--color-lavender-bg)', color: 'var(--color-text-primary)' }}
      />
    </div>
  )
}

function WTextarea({ label, name, hint, placeholder }: {
  label: string; name: string; hint?: string; placeholder?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{label}</label>
      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
        {hint}
      </p>
      <textarea
        name={name}
        rows={4}
        placeholder={placeholder}
        maxLength={2000}
        className="px-3 py-2.5 rounded-lg border text-sm outline-none resize-none"
        style={{ borderColor: 'var(--color-lavender-card)', background: 'var(--color-lavender-bg)', color: 'var(--color-text-primary)' }}
      />
    </div>
  )
}
