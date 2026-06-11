'use client'

import type { Profile, Application } from '@/lib/api'

const OPLEIDINGSNIVEAU_LABELS: Record<string, string> = {
  vmbo: 'VMBO / Basis', mbo: 'MBO', hbo: 'HBO',
  wo_bachelor: 'WO Bachelor', wo_master: 'WO Master', phd: 'PhD',
}

function profileCompleteness(p: Profile): { pct: number; missing: string[] } {
  const fields: [keyof Profile, string][] = [
    ['functietitel', 'Functietitel'],
    ['woonplaats', 'Woonplaats'],
    ['uren_per_week', 'Uren per week'],
    ['werklocatie', 'Werklocatie'],
    ['opleidingsniveau', 'Opleidingsniveau'],
    ['cv_url', 'CV'],
  ]
  const filled = fields.filter(([k]) => !!p[k]).length
  const missing = fields.filter(([k]) => !p[k]).map(([, l]) => l)
  return { pct: Math.round((filled / fields.length) * 100), missing }
}

interface Props {
  profile: Profile | null
  applications: Application[]
}

export default function Achievements({ profile, applications }: Props) {
  if (!profile) return null

  const { pct, missing } = profileCompleteness(profile)
  const hasCV = !!profile.cv_url
  const hasApplied = applications.length > 0

  const achievements = [
    {
      key: 'profile',
      done: true,
      icon: '👤',
      title: 'Profiel aangemaakt',
      desc: 'Je eerste stap is gezet.',
    },
    {
      key: 'cv',
      done: hasCV,
      icon: '📄',
      title: 'CV geüpload',
      desc: hasCV ? 'CV is opgeslagen.' : 'Upload je CV voor betere brieven.',
      cta: hasCV ? undefined : { label: 'CV uploaden', href: '/dashboard/settings' },
    },
    {
      key: 'apply',
      done: hasApplied,
      icon: '🚀',
      title: 'Eerste sollicitatie',
      desc: hasApplied ? `${applications.length} sollicitatie${applications.length !== 1 ? 's' : ''} verstuurd.` : 'Solliciteer op je eerste vacature.',
      cta: hasApplied ? undefined : { label: 'Zoek vacatures', href: '/dashboard' },
    },
    {
      key: 'complete',
      done: pct === 100,
      icon: '⭐',
      title: 'Profiel compleet',
      desc: pct === 100 ? 'Alle velden zijn ingevuld.' : `${pct}% compleet — nog: ${missing.join(', ')}.`,
      cta: pct < 100 ? { label: 'Aanvullen', href: '/dashboard/settings' } : undefined,
    },
  ]

  const doneCount = achievements.filter(a => a.done).length

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Voortgang</h2>
        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{doneCount}/{achievements.length} voltooid</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 rounded-full mb-4 overflow-hidden" style={{ background: 'var(--color-lavender-card)' }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${(doneCount / achievements.length) * 100}%`, background: 'var(--color-indigo-primary)' }}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {achievements.map(a => (
          <div
            key={a.key}
            className="rounded-xl p-3 flex flex-col gap-1.5"
            style={{
              background: a.done ? 'var(--color-lavender-card)' : 'var(--color-lavender-bg)',
              border: `1px solid ${a.done ? 'var(--color-indigo-light)' : 'var(--color-lavender-card)'}`,
              opacity: a.done ? 1 : 0.7,
            }}
          >
            <span className="text-lg">{a.icon}</span>
            <p className="text-xs font-semibold leading-tight" style={{ color: a.done ? 'var(--color-indigo-primary)' : 'var(--color-text-muted)' }}>
              {a.title}
            </p>
            <p className="text-xs leading-snug" style={{ color: 'var(--color-text-muted)' }}>{a.desc}</p>
            {a.cta && (
              <a
                href={a.cta.href}
                className="text-xs font-medium underline mt-auto"
                style={{ color: 'var(--color-indigo-primary)' }}
              >
                {a.cta.label}
              </a>
            )}
            {a.done && (
              <span className="text-xs font-bold mt-auto" style={{ color: 'var(--color-indigo-primary)' }}>✓</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
