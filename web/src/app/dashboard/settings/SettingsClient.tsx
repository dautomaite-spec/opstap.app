'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { logout } from '@/app/actions/auth'
import { api, ApiError } from '@/lib/api'
import type { Profile, TransactionOut } from '@/lib/api'
import ReferralSection from './ReferralSection'

export default function SettingsClient({ userId, userEmail }: { userId: string; userEmail: string }) {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  // Profile edit state
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState('')

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
    try {
      await api.profile.update({ email_digest_enabled: digest, email_reminders_enabled: reminders, cv_expiry_reminder_enabled: cvExpiry })
    } catch {
      setEmailDigest(profile?.email_digest_enabled ?? true)
      setEmailReminders(profile?.email_reminders_enabled ?? true)
      setCvExpiryReminder(profile?.cv_expiry_reminder_enabled ?? true)
    } finally {
      setSavingPrefs(false)
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
        woonplaats: (fd.get('woonplaats') as string) || undefined,
        uren_per_week: fd.get('uren_per_week') ? Number(fd.get('uren_per_week')) : undefined,
        werklocatie: (fd.get('werklocatie') as string) || undefined,
        opleidingsniveau: (fd.get('opleidingsniveau') as string) || undefined,
      })
      setProfile(updated)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Opslaan mislukt. Probeer het opnieuw.')
    } finally {
      setSaving(false)
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
      setCvUploadSuccess(`CV opgeslagen. Vervalt op ${new Date(res.expires_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}.`)
      setProfile(p => p ? { ...p, cv_url: 'uploaded', cv_expires_at: res.expires_at } : p)
    } catch (err) {
      setCvError(err instanceof ApiError ? err.message : 'CV uploaden mislukt. Probeer het opnieuw.')
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
      setCvError(err instanceof ApiError ? err.message : 'CV verwijderen mislukt.')
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
      // silently fail -user can retry
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
      setDeleteError(err instanceof ApiError ? err.message : 'Account verwijderen mislukt. Probeer het opnieuw.')
      setDeletingAccount(false)
      setConfirmDelete(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-sm" style={{ color: 'var(--color-text-muted)' }}>Laden…</div>
    )
  }

  return (
    <div className="max-w-lg mx-auto">

        {/* Profile section */}
        <section className="mb-10">
          <h2 className="text-base font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>Profiel bewerken</h2>
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
              <Field label="Functietitel" name="functietitel" placeholder="bijv. Verpleegkundige" defaultValue={profile.functietitel} />
              <Field label="Woonplaats" name="woonplaats" placeholder="bijv. Amsterdam" defaultValue={profile.woonplaats} />
              <Field label="Uren per week" name="uren_per_week" type="number" placeholder="40" defaultValue={profile.uren_per_week?.toString()} />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Werklocatie</label>
                <select
                  name="werklocatie"
                  defaultValue={profile.werklocatie ?? ''}
                  className="px-3 py-2 rounded-lg border text-sm"
                  style={{ borderColor: 'var(--color-lavender-card)', background: 'var(--color-lavender-bg)', color: 'var(--color-text-primary)' }}
                >
                  <option value="">Geen voorkeur</option>
                  <option value="op locatie">Op locatie</option>
                  <option value="hybride">Hybride</option>
                  <option value="remote">Thuis werken</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Opleidingsniveau</label>
                <select
                  name="opleidingsniveau"
                  defaultValue={profile.opleidingsniveau ?? ''}
                  className="px-3 py-2 rounded-lg border text-sm"
                  style={{ borderColor: 'var(--color-lavender-card)', background: 'var(--color-lavender-bg)', color: 'var(--color-text-primary)' }}
                >
                  <option value="">Niet opgegeven</option>
                  <option value="vmbo">VMBO / Basis</option>
                  <option value="mbo">MBO</option>
                  <option value="hbo">HBO</option>
                  <option value="wo_bachelor">WO Bachelor</option>
                  <option value="wo_master">WO Master</option>
                  <option value="phd">PhD / Promotie</option>
                </select>
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
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Geen profiel gevonden. Ga naar het dashboard om een profiel aan te maken.</p>
          )}
        </section>

        {/* AVG consent modal */}
        {showAvgConsent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
            <div className="w-full max-w-md rounded-2xl p-6" style={{ background: 'var(--color-white)' }}>
              <h3 className="font-bold text-base mb-3" style={{ color: 'var(--color-text-primary)' }}>Toestemming CV opslaan</h3>
              <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
                Je CV wordt versleuteld opgeslagen en uitsluitend gebruikt voor het genereren van sollicitatiebrieven. Nooit gedeeld met derden of gebruikt voor AI-training.
              </p>
              <p className="text-sm mb-1 font-medium" style={{ color: 'var(--color-text-primary)' }}>Bewaartermijn</p>
              <select
                value={retentionDays}
                onChange={e => setRetentionDays(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border text-sm mb-4"
                style={{ borderColor: 'var(--color-lavender-card)', background: 'var(--color-lavender-bg)', color: 'var(--color-text-primary)' }}
              >
                <option value={7}>7 dagen</option>
                <option value={30}>30 dagen (standaard)</option>
                <option value={90}>90 dagen</option>
              </select>
              <p className="text-xs mb-5" style={{ color: 'var(--color-text-muted)' }}>
                Je ontvangt 7 dagen voor het verlopen een herinnering. Je kunt je CV altijd eerder verwijderen via Instellingen.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowAvgConsent(false)}
                  className="px-4 py-2 text-sm rounded-lg border hover:opacity-80 transition"
                  style={{ borderColor: 'var(--color-lavender-card)', color: 'var(--color-text-muted)' }}
                >
                  Annuleren
                </button>
                <button
                  onClick={handleAvgAccept}
                  className="px-5 py-2 text-sm font-semibold rounded-lg text-white transition hover:opacity-90"
                  style={{ background: 'var(--color-indigo-primary)' }}
                >
                  Ik ga akkoord
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CV section */}
        <section className="mb-10 pt-6 border-t" style={{ borderColor: 'var(--color-lavender-card)' }}>
          <h2 className="text-base font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>CV</h2>
          {cvUploadSuccess && (
            <p className="text-sm mb-3 px-3 py-2 rounded-lg" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success-text)' }}>{cvUploadSuccess}</p>
          )}
          {cvError && <p className="text-sm mb-3" style={{ color: 'var(--color-error)' }}>{cvError}</p>}
          {/* Hidden file input -triggered after AVG consent */}
          <input ref={fileInputRef} type="file" accept=".pdf,.docx" className="hidden" onChange={handleUploadCV} disabled={uploadingCV} />
          {profile?.cv_url ? (
            <>
              <p className="text-sm mb-1" style={{ color: 'var(--color-text-muted)' }}>Er is een CV opgeslagen.</p>
              {profile.cv_expires_at && (
                <p className="text-sm mb-3" style={{ color: 'var(--color-text-muted)' }}>
                  Vervalt op {new Date(profile.cv_expires_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}.
                </p>
              )}
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={handleCVButtonClick}
                  disabled={uploadingCV}
                  className="text-sm px-4 py-2 rounded-lg border transition hover:opacity-80 disabled:opacity-50"
                  style={{ borderColor: 'var(--color-lavender-card)', color: 'var(--color-text-muted)' }}
                >
                  {uploadingCV ? 'Uploaden…' : 'Nieuw CV uploaden'}
                </button>
                <button
                  onClick={handleDeleteCV}
                  disabled={deletingCV}
                  className="text-sm px-4 py-2 rounded-lg border transition hover:opacity-80 disabled:opacity-50"
                  style={{ borderColor: '#ef4444', color: '#ef4444' }}
                >
                  {deletingCV ? 'Verwijderen…' : 'CV verwijderen'}
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm mb-3" style={{ color: 'var(--color-text-muted)' }}>Geen CV opgeslagen.</p>
              <button
                onClick={handleCVButtonClick}
                disabled={uploadingCV}
                className="text-sm px-4 py-2 rounded-lg text-white transition hover:opacity-90 disabled:opacity-50"
                style={{ background: 'var(--color-indigo-primary)' }}
              >
                {uploadingCV ? 'Uploaden…' : 'CV uploaden'}
              </button>
              <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>PDF of DOCX, max 10 MB</p>
            </>
          )}
        </section>

        {/* Referral section */}
        <section className="mb-10 pt-6 border-t" style={{ borderColor: 'var(--color-lavender-card)' }}>
          <h2 className="text-base font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>Vrienden uitnodigen</h2>
          <p className="text-sm mb-3" style={{ color: 'var(--color-text-muted)' }}>
            Deel jouw link. Jij ontvangt 3 credits zodra je vriend zijn eerste brief genereert. Je vriend start met 8 credits in plaats van 5.
          </p>
          <ReferralSection />
        </section>

        {/* Credits & betalingen */}
        <section className="mb-10 pt-6 border-t" style={{ borderColor: 'var(--color-lavender-card)' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>Credits & betalingen</h2>
            {!txLoaded && (
              <button
                onClick={loadTransactions}
                disabled={txLoading}
                className="text-xs underline disabled:opacity-50"
                style={{ color: 'var(--color-indigo-primary)' }}
              >
                {txLoading ? 'Laden…' : 'Toon geschiedenis'}
              </button>
            )}
          </div>
          {txLoaded && transactions.length === 0 && (
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Geen transacties gevonden.</p>
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
                        {new Date(tx.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}
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
          <h2 className="text-base font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>E-mailmeldingen</h2>
          <p className="text-xs mb-4" style={{ color: 'var(--color-text-muted)' }}>
            Je kunt je op elk moment afmelden. We sturen nooit spam.
          </p>
          <div className="flex flex-col gap-4">
            <Toggle
              label="Wekelijkse vacaturedigest"
              description="Elke maandag een overzicht van nieuwe vacatures die bij je profiel passen."
              checked={emailDigest}
              disabled={savingPrefs}
              onChange={v => {
                setEmailDigest(v)
                handleSaveEmailPrefs(v, emailReminders, cvExpiryReminder)
              }}
            />
            <Toggle
              label="Sollicitatie herinneringen"
              description="Een herinnering als je 2 weken na een sollicitatie nog niets hebt gehoord."
              checked={emailReminders}
              disabled={savingPrefs}
              onChange={v => {
                setEmailReminders(v)
                handleSaveEmailPrefs(emailDigest, v, cvExpiryReminder)
              }}
            />
            <Toggle
              label="CV-vervaldatum herinnering"
              description="Een e-mail 7 dagen voor je CV automatisch wordt verwijderd."
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
          <h2 className="text-base font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>Jouw gegevens</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
            Download een kopie van al jouw gegevens: profiel, sollicitaties (inclusief brieven), opgeslagen vacatures, creditgeschiedenis en uitnodigingen
          </p>
          <button
            onClick={handleExportData}
            disabled={exportingData}
            className="text-sm px-4 py-2 rounded-lg border transition hover:opacity-80 disabled:opacity-50"
            style={{ borderColor: 'var(--color-lavender-card)', color: 'var(--color-indigo-primary)' }}
          >
            {exportingData ? 'Exporteren…' : 'Download mijn gegevens'}
          </button>
        </section>

        {/* Danger zone */}
        <section className="pt-6 border-t" style={{ borderColor: 'var(--color-lavender-card)' }}>
          <h2 className="text-base font-bold mb-2" style={{ color: '#ef4444' }}>Account verwijderen</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
            Je account, profiel, CV en alle sollicitaties worden permanent verwijderd. Dit kan niet ongedaan worden gemaakt.
          </p>
          {deleteError && <p className="text-sm mb-3" style={{ color: 'var(--color-error)' }}>{deleteError}</p>}
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-sm px-4 py-2 rounded-lg border transition hover:opacity-80"
              style={{ borderColor: '#ef4444', color: '#ef4444' }}
            >
              Account verwijderen
            </button>
          ) : (
            <div className="flex flex-col gap-3 p-4 rounded-xl" style={{ background: 'var(--color-error-bg)' }}>
              <p className="text-sm font-medium" style={{ color: '#ef4444' }}>
                Weet je het zeker? Dit is permanent en kan niet ongedaan worden gemaakt.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-sm px-4 py-2 rounded-lg border hover:bg-white transition"
                  style={{ borderColor: 'var(--color-lavender-card)', color: 'var(--color-text-muted)' }}
                >
                  Annuleren
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deletingAccount}
                  className="text-sm px-4 py-2 rounded-lg text-white font-medium transition hover:opacity-90 disabled:opacity-50"
                  style={{ background: '#ef4444' }}
                >
                  {deletingAccount ? 'Verwijderen…' : 'Ja, verwijder mijn account'}
                </button>
              </div>
            </div>
          )}
        </section>
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
