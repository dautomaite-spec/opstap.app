'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { api, ApiError } from '@/lib/api'

const ONBOARDING_KEY = 'opstap_onboarding_done'

function markDone() {
  try { localStorage.setItem(ONBOARDING_KEY, '1') } catch {}
}

type Step = 1 | 2 | 3

export default function WelkomPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)

  // Step 1 — profile
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  // Step 2 — CV
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
        woonplaats: (fd.get('woonplaats') as string) || undefined,
      })
      setStep(2)
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Opslaan mislukt. Probeer het opnieuw.')
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
      setCvDone(true)
      setTimeout(() => setStep(3), 800)
    } catch (err) {
      setCvError(err instanceof ApiError ? err.message : 'CV uploaden mislukt.')
    } finally {
      setUploadingCV(false)
      e.target.value = ''
    }
  }

  function finish() {
    markDone()
    router.replace('/dashboard')
  }

  return (
    <div className="max-w-md mx-auto pt-4">

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 mb-8">
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

      {/* Step 1 — Profile */}
      {step === 1 && (
        <div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-indigo-primary)' }}>
            Welkom bij Opstap!
          </h1>
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
            Vertel ons iets over jezelf. We gebruiken dit om de juiste vacatures en brieven voor je te vinden.
          </p>
          {saveError && (
            <p className="text-sm mb-4 px-3 py-2 rounded-lg" style={{ background: 'var(--color-error-bg)', color: 'var(--color-error)' }}>{saveError}</p>
          )}
          <form onSubmit={handleProfileSave} className="flex flex-col gap-4">
            <WField label="Hoe heet je? *" name="naam" required placeholder="Voor- en achternaam" />
            <WField label="Wat voor werk zoek je?" name="functietitel" placeholder="bijv. Verpleegkundige, Software Developer" />
            <WField label="Waar woon je?" name="woonplaats" placeholder="bijv. Amsterdam" />
            <button
              type="submit"
              disabled={saving}
              className="py-3 rounded-xl text-sm font-semibold text-white mt-2 transition hover:opacity-90 disabled:opacity-50"
              style={{ background: 'var(--color-indigo-primary)' }}
            >
              {saving ? 'Opslaan…' : 'Verder →'}
            </button>
          </form>
        </div>
      )}

      {/* Step 2 — CV */}
      {step === 2 && (
        <div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-indigo-primary)' }}>
            Upload je CV
          </h1>
          <p className="text-sm mb-2" style={{ color: 'var(--color-text-muted)' }}>
            Met je CV schrijft Opstap sterkere, persoonlijkere brieven. Je kunt dit ook later doen.
          </p>
          <p className="text-xs mb-6" style={{ color: 'var(--color-text-muted)' }}>
            Je CV wordt versleuteld opgeslagen op EU-servers en nooit gedeeld met derden.
          </p>

          {cvError && <p className="text-sm mb-4" style={{ color: 'var(--color-error)' }}>{cvError}</p>}

          {cvDone ? (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-4" style={{ background: 'var(--color-success-bg)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-success-text)' }}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <p className="text-sm font-medium" style={{ color: 'var(--color-success-text)' }}>CV opgeslagen!</p>
            </div>
          ) : (
            <>
              {/* AVG consent modal */}
              {showAvgConsent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
                  <div className="w-full max-w-md rounded-2xl p-6" style={{ background: 'var(--color-white)' }}>
                    <h3 className="font-bold text-base mb-3" style={{ color: 'var(--color-text-primary)' }}>Toestemming CV opslaan</h3>
                    <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
                      Je CV wordt versleuteld opgeslagen op EU-servers. Het wordt alleen gebruikt voor het genereren van sollicitatiebrieven en nooit gedeeld met derden of voor AI-training gebruikt.
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
                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={() => setShowAvgConsent(false)}
                        className="px-4 py-2 text-sm rounded-lg border hover:opacity-80 transition"
                        style={{ borderColor: 'var(--color-lavender-card)', color: 'var(--color-text-muted)' }}
                      >
                        Annuleren
                      </button>
                      <button
                        onClick={() => { setShowAvgConsent(false); fileInputRef.current?.click() }}
                        className="px-5 py-2 text-sm font-semibold rounded-lg text-white transition hover:opacity-90"
                        style={{ background: 'var(--color-indigo-primary)' }}
                      >
                        Ik ga akkoord
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
                {uploadingCV ? 'Uploaden…' : 'CV uploaden (PDF of DOCX)'}
              </button>
            </>
          )}

          <button
            onClick={() => setStep(3)}
            className="w-full py-3 rounded-xl text-sm font-medium border transition hover:opacity-80"
            style={{ borderColor: 'var(--color-lavender-card)', color: 'var(--color-text-muted)' }}
          >
            {cvDone ? 'Verder →' : 'Overslaan'}
          </button>
        </div>
      )}

      {/* Step 3 — Ready */}
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
            Je bent er klaar voor!
          </h1>
          <p className="text-sm mb-2" style={{ color: 'var(--color-text-muted)' }}>
            Je hebt <strong style={{ color: 'var(--color-text-primary)' }}>5 gratis credits</strong> om mee te starten.
          </p>
          <p className="text-sm mb-8" style={{ color: 'var(--color-text-muted)' }}>
            Zoek vacatures, kies er meerdere tegelijk en laat Opstap je brieven schrijven.
          </p>
          <button
            onClick={finish}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white transition hover:opacity-90"
            style={{ background: 'var(--color-indigo-primary)' }}
          >
            Vacatures zoeken →
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
