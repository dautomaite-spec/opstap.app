'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { logout } from '@/app/actions/auth'
import { api, ApiError } from '@/lib/api'
import type { Profile, TransactionOut } from '@/lib/api'
import ReferralSection from './ReferralSection'

export default function SettingsClient() {
  const router = useRouter()
  const t = useTranslations('SettingsPage')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  // CV state
  const [uploadingCV, setUploadingCV] = useState(false)
  const [cvUploadSuccess, setCvUploadSuccess] = useState('')
  const [deletingCV, setDeletingCV] = useState(false)
  const [cvError, setCvError] = useState('')
  const [showAvgConsent, setShowAvgConsent] = useState(false)
  const [retentionDays, setRetentionDays] = useState(30)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Credit history state
  const [transactions, setTransactions] = useState<TransactionOut[]>([])
  const [txLoading, setTxLoading] = useState(false)
  const [txLoaded, setTxLoaded] = useState(false)

  // Email preferences state
  const [emailDigest, setEmailDigest] = useState(true)
  const [emailReminders, setEmailReminders] = useState(true)
  const [cvExpiryReminder, setCvExpiryReminder] = useState(true)
  const [savingPrefs, setSavingPrefs] = useState(false)

  // Data export state
  const [exportingData, setExportingData] = useState(false)

  // Account delete state
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    api.profile.get()
      .then(p => {
        setProfile(p)
        setEmailDigest(p.email_digest_enabled ?? true)
        setEmailReminders(p.email_reminders_enabled ?? true)
        setCvExpiryReminder(p.cv_expiry_reminder_enabled ?? true)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function loadTransactions() {
    if (txLoaded) return
    setTxLoading(true)
    try {
      const tx = await api.credits.transactions()
      setTransactions(tx)
      setTxLoaded(true)
    } catch {
      // ignore
    } finally {
      setTxLoading(false)
    }
  }

  async function handleSaveEmailPrefs(digest: boolean, reminders: boolean, cvExpiry: boolean) {
    setSavingPrefs(true)
    // Snapshot the values as they were BEFORE this save — `profile` holds the
    // values from page load, so rolling back to it would undo earlier successful
    // toggles too.
    const prev = {
      email_digest_enabled: emailDigest,
      email_reminders_enabled: emailReminders,
      cv_expiry_reminder_enabled: cvExpiryReminder,
    }
    try {
      await api.profile.update({ email_digest_enabled: digest, email_reminders_enabled: reminders, cv_expiry_reminder_enabled: cvExpiry })
      // Keep `profile` in sync so it stays a valid rollback target
      setProfile(p => p ? { ...p, email_digest_enabled: digest, email_reminders_enabled: reminders, cv_expiry_reminder_enabled: cvExpiry } : p)
    } catch {
      setEmailDigest(prev.email_digest_enabled)
      setEmailReminders(prev.email_reminders_enabled)
      setCvExpiryReminder(prev.cv_expiry_reminder_enabled)
    } finally {
      setSavingPrefs(false)
    }
  }

  function handleCVButtonClick() {
    setShowAvgConsent(true)
  }

  function handleAvgAccept() {
    setShowAvgConsent(false)
    fileInputRef.current?.click()
  }

  async function handleUploadCV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingCV(true)
    setCvError('')
    setCvUploadSuccess('')
    try {
      const res = await api.profile.uploadCV(file, retentionDays)
      setCvUploadSuccess(t('cvUploadSuccessMessage', { datum: new Date(res.expires_at).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) }))
      setProfile(p => p ? { ...p, cv_url: 'uploaded', cv_expires_at: res.expires_at } : p)
    } catch (err) {
      setCvError(err instanceof ApiError ? err.message : t('cvUploadError'))
    } finally {
      setUploadingCV(false)
      e.target.value = ''
    }
  }

  async function handleDeleteCV() {
    setDeletingCV(true)
    setCvError('')
    setCvUploadSuccess('')
    try {
      await api.profile.deleteCV()
      setProfile(p => p ? { ...p, cv_url: undefined, cv_expires_at: undefined } : p)
    } catch (err) {
      setCvError(err instanceof ApiError ? err.message : t('cvDeleteError'))
    } finally {
      setDeletingCV(false)
    }
  }

  async function handleExportData() {
    setExportingData(true)
    try {
      const blob = await api.profile.exportData()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'opstap-mijn-gegevens.json'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // silently fail — user can retry
    } finally {
      setExportingData(false)
    }
  }

  async function handleDeleteAccount() {
    setDeletingAccount(true)
    setDeleteError('')
    try {
      await api.profile.deleteAccount()
      await logout()
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : t('deleteAccountError'))
      setDeletingAccount(false)
      setConfirmDelete(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-sm" style={{ color: 'var(--color-text-muted)' }}>{t('loadingText')}</div>
    )
  }

  return (
    <div className="max-w-lg mx-auto">

      {/* Profile section */}
      <section className="mb-10">
        <h2 className="text-base font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>{t('profileSectionHeading')}</h2>
        {profile ? (
          <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--color-lavender-card)' }}>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{profile.naam}</p>
              {profile.functietitel && (
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{profile.functietitel}</p>
              )}
            </div>
            <a
              href="/dashboard/profiel"
              className="text-xs px-3 py-1.5 rounded-lg font-medium transition hover:opacity-90"
              style={{ background: 'var(--color-indigo-primary)', color: 'white' }}
            >
              {t('profileEditButton')}
            </a>
          </div>
        ) : (
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{t('profileNotFound')}</p>
        )}
      </section>

      {/* AVG consent modal */}
      {showAvgConsent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ background: 'var(--color-white)' }}>
            <h3 className="font-bold text-base mb-3" style={{ color: 'var(--color-text-primary)' }}>{t('avgConsentModalHeading')}</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
              {t('avgConsentDescription')}
            </p>
            <p className="text-sm mb-1 font-medium" style={{ color: 'var(--color-text-primary)' }}>{t('avgRetentionLabel')}</p>
            <select
              value={retentionDays}
              onChange={e => setRetentionDays(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border text-sm mb-4"
              style={{ borderColor: 'var(--color-lavender-card)', background: 'var(--color-lavender-bg)', color: 'var(--color-text-primary)' }}
            >
              <option value={7}>{t('avgRetentionOption7Days')}</option>
              <option value={30}>{t('avgRetentionOption30Days')}</option>
              <option value={90}>{t('avgRetentionOption90Days')}</option>
            </select>
            <p className="text-xs mb-5" style={{ color: 'var(--color-text-muted)' }}>
              {t('avgRetentionReminderNote')}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowAvgConsent(false)}
                className="px-4 py-2 text-sm rounded-lg border hover:opacity-80 transition"
                style={{ borderColor: 'var(--color-lavender-card)', color: 'var(--color-text-muted)' }}
              >
                {t('avgCancelButton')}
              </button>
              <button
                onClick={handleAvgAccept}
                className="px-5 py-2 text-sm font-semibold rounded-lg text-white transition hover:opacity-90"
                style={{ background: 'var(--color-indigo-primary)' }}
              >
                {t('avgAcceptButton')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CV section */}
      <section className="mb-10 pt-6 border-t" style={{ borderColor: 'var(--color-lavender-card)' }}>
        <h2 className="text-base font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>{t('cvSectionHeading')}</h2>
        {cvUploadSuccess && (
          <p className="text-sm mb-3 px-3 py-2 rounded-lg" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success-text)' }}>{cvUploadSuccess}</p>
        )}
        {cvError && <p className="text-sm mb-3" style={{ color: 'var(--color-error)' }}>{cvError}</p>}
        <input ref={fileInputRef} type="file" accept=".pdf,.docx" className="hidden" onChange={handleUploadCV} disabled={uploadingCV} />
        {profile?.cv_url ? (
          <>
            <p className="text-sm mb-1" style={{ color: 'var(--color-text-muted)' }}>{t('cvStoredStatus')}</p>
            {profile.cv_expires_at && (
              <p className="text-sm mb-3" style={{ color: 'var(--color-text-muted)' }}>
                {t('cvExpiresAt', { datum: new Date(profile.cv_expires_at).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) })}
              </p>
            )}
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={handleCVButtonClick}
                disabled={uploadingCV}
                className="text-sm px-4 py-2 rounded-lg border transition hover:opacity-80 disabled:opacity-50"
                style={{ borderColor: 'var(--color-lavender-card)', color: 'var(--color-text-muted)' }}
              >
                {uploadingCV ? t('cvUploadingButton') : t('cvReplaceButton')}
              </button>
              <button
                onClick={handleDeleteCV}
                disabled={deletingCV}
                className="text-sm px-4 py-2 rounded-lg border transition hover:opacity-80 disabled:opacity-50"
                style={{ borderColor: '#ef4444', color: '#ef4444' }}
              >
                {deletingCV ? t('cvDeletingButton') : t('cvDeleteButton')}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm mb-3" style={{ color: 'var(--color-text-muted)' }}>{t('cvNotStoredStatus')}</p>
            <button
              onClick={handleCVButtonClick}
              disabled={uploadingCV}
              className="text-sm px-4 py-2 rounded-lg text-white transition hover:opacity-90 disabled:opacity-50"
              style={{ background: 'var(--color-indigo-primary)' }}
            >
              {uploadingCV ? t('cvUploadingButton') : t('cvUploadButton')}
            </button>
            <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>{t('cvFileFormatHint')}</p>
          </>
        )}
      </section>

      {/* Referral section */}
      <section className="mb-10 pt-6 border-t" style={{ borderColor: 'var(--color-lavender-card)' }}>
        <h2 className="text-base font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>{t('referralSectionHeading')}</h2>
        <p className="text-sm mb-3" style={{ color: 'var(--color-text-muted)' }}>
          {t('referralSectionDescription')}
        </p>
        <ReferralSection />
      </section>

      {/* Credits & betalingen */}
      <section className="mb-10 pt-6 border-t" style={{ borderColor: 'var(--color-lavender-card)' }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>{t('creditsSectionHeading')}</h2>
          {!txLoaded && (
            <button
              onClick={loadTransactions}
              disabled={txLoading}
              className="text-xs underline disabled:opacity-50"
              style={{ color: 'var(--color-indigo-primary)' }}
            >
              {txLoading ? t('creditsLoadingButton') : t('creditsShowHistoryButton')}
            </button>
          )}
        </div>
        {txLoaded && transactions.length === 0 && (
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{t('creditsNoTransactions')}</p>
        )}
        {txLoaded && transactions.length > 0 && (
          <div className="flex flex-col gap-2">
            {transactions.slice(0, 20).map(tx => {
              const positive = tx.delta > 0
              return (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: 'var(--color-lavender-card)' }}>
                  <div>
                    <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{tx.reason.replace(/_/g, ' ')}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {new Date(tx.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <span className="text-sm font-semibold" style={{ color: positive ? '#16a34a' : '#dc2626' }}>
                    {positive ? '+' : ''}{tx.delta}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* E-mailmeldingen */}
      <section className="mb-10 pt-6 border-t" style={{ borderColor: 'var(--color-lavender-card)' }}>
        <h2 className="text-base font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>{t('emailNotificationsSectionHeading')}</h2>
        <p className="text-xs mb-4" style={{ color: 'var(--color-text-muted)' }}>
          {t('emailNotificationsDescription')}
        </p>
        <div className="flex flex-col gap-4">
          <Toggle
            label={t('emailDigestToggleLabel')}
            description={t('emailDigestToggleDescription')}
            checked={emailDigest}
            disabled={savingPrefs}
            onChange={v => {
              setEmailDigest(v)
              handleSaveEmailPrefs(v, emailReminders, cvExpiryReminder)
            }}
          />
          <Toggle
            label={t('emailRemindersToggleLabel')}
            description={t('emailRemindersToggleDescription')}
            checked={emailReminders}
            disabled={savingPrefs}
            onChange={v => {
              setEmailReminders(v)
              handleSaveEmailPrefs(emailDigest, v, cvExpiryReminder)
            }}
          />
          <Toggle
            label={t('cvExpiryReminderToggleLabel')}
            description={t('cvExpiryReminderToggleDescription')}
            checked={cvExpiryReminder}
            disabled={savingPrefs}
            onChange={v => {
              setCvExpiryReminder(v)
              handleSaveEmailPrefs(emailDigest, emailReminders, v)
            }}
          />
        </div>
      </section>

      {/* Jouw gegevens / AVG Art. 20 export */}
      <section className="mb-10 pt-6 border-t" style={{ borderColor: 'var(--color-lavender-card)' }}>
        <h2 className="text-base font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>{t('yourDataSectionHeading')}</h2>
        <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
          {t('yourDataDescription')}
        </p>
        <button
          onClick={handleExportData}
          disabled={exportingData}
          className="text-sm px-4 py-2 rounded-lg border transition hover:opacity-80 disabled:opacity-50"
          style={{ borderColor: 'var(--color-lavender-card)', color: 'var(--color-indigo-primary)' }}
        >
          {exportingData ? t('exportingButton') : t('downloadMyDataButton')}
        </button>
      </section>

      {/* Danger zone */}
      <section className="pt-6 border-t rounded-xl p-4 mt-2" style={{ borderColor: '#fca5a5', border: '1px solid #fca5a5', background: '#fff5f5' }}>
        <h2 className="text-base font-bold mb-2" style={{ color: '#ef4444' }}>{t('deleteAccountSectionHeading')}</h2>
        <p className="text-sm mb-4" style={{ color: '#7f1d1d' }}>
          {t('deleteAccountDescription')}
        </p>
        {deleteError && <p className="text-sm mb-3" style={{ color: 'var(--color-error)' }}>{deleteError}</p>}
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="text-sm px-4 py-2 rounded-lg border transition hover:opacity-80"
            style={{ borderColor: '#ef4444', color: '#ef4444' }}
          >
            {t('deleteAccountButton')}
          </button>
        ) : (
          <div className="flex flex-col gap-3 p-4 rounded-xl" style={{ background: 'var(--color-error-bg)' }}>
            <p className="text-sm font-medium" style={{ color: '#ef4444' }}>
              {t('deleteAccountConfirmWarning')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-sm px-4 py-2 rounded-lg border hover:bg-white transition"
                style={{ borderColor: 'var(--color-lavender-card)', color: 'var(--color-text-muted)' }}
              >
                {t('deleteAccountCancelButton')}
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
                className="text-sm px-4 py-2 rounded-lg text-white font-medium transition hover:opacity-90 disabled:opacity-50"
                style={{ background: '#ef4444' }}
              >
                {deletingAccount ? t('deleteAccountDeletingButton') : t('deleteAccountConfirmButton')}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}


function Toggle({ label, description, checked, disabled, onChange }: {
  label: string; description: string; checked: boolean; disabled?: boolean; onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-start gap-3">
      <button
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className="relative mt-0.5 shrink-0 transition disabled:opacity-50"
        style={{
          width: 40, height: 22, borderRadius: 11,
          background: checked ? 'var(--color-indigo-primary)' : 'var(--color-lavender-card)',
        }}
      >
        <span
          className="absolute transition-all"
          style={{
            width: 16, height: 16, borderRadius: '50%', background: 'white', top: 3,
            left: checked ? 21 : 3, boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }}
        />
      </button>
      <div>
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{label}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{description}</p>
      </div>
    </div>
  )
}
