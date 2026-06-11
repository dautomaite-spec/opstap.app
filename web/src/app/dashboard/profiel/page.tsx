'use client'

import { useState, useEffect } from 'react'
import { api, ApiError } from '@/lib/api'
import type { Profile, Application } from '@/lib/api'
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

  useEffect(() => {
    Promise.all([
      api.profile.get().catch(() => null),
      api.apply.history().catch(() => []),
    ]).then(([p, apps]) => {
      setProfile(p)
      setApplications(apps as Application[])
    }).finally(() => setLoading(false))
  }, [])

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
              <Field label="Functietitel" name="functietitel" placeholder="bijv. Verpleegkundige" defaultValue={profile.functietitel} />
              <Field label="Woonplaats" name="woonplaats" placeholder="bijv. Amsterdam" defaultValue={profile.woonplaats} />
              <Field label="Uren per week" name="uren_per_week" type="number" placeholder="40" defaultValue={profile.uren_per_week?.toString()} />
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
