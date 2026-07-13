'use client'

import { useTranslations } from 'next-intl'
import type { Profile, Application } from '@/lib/api'

export function profileCompletenessKeys(p: Profile): { pct: number; missingKeys: string[] } {
  const fields: [keyof Profile, string][] = [
    ['functietitel', 'missingFieldFunctietitel'],
    ['woonplaats', 'missingFieldWoonplaats'],
    ['uren_per_week', 'missingFieldUrenPerWeek'],
    ['werklocatie', 'missingFieldWerklocatie'],
    ['opleidingsniveau', 'missingFieldOpleidingsniveau'],
    ['cv_url', 'missingFieldCv'],
  ]
  const filled = fields.filter(([k]) => !!p[k]).length
  const missingKeys = fields.filter(([k]) => !p[k]).map(([, key]) => key)
  return { pct: Math.round((filled / fields.length) * 100), missingKeys }
}

interface Props {
  profile: Profile | null
  applications: Application[]
}

export default function Achievements({ profile, applications }: Props) {
  const t = useTranslations('Achievements')

  if (!profile) return null

  const { pct, missingKeys } = profileCompletenessKeys(profile)
  const missing = missingKeys.map(key => t(key as Parameters<typeof t>[0]))
  const hasCV = !!profile.cv_url
  const hasApplied = applications.length > 0

  const achievements = [
    {
      key: 'profile',
      done: true,
      icon: '👤',
      title: t('achievementProfileTitle'),
      desc: t('achievementProfileDesc'),
    },
    {
      key: 'cv',
      done: hasCV,
      icon: '📄',
      title: t('achievementCvTitle'),
      desc: hasCV ? t('achievementCvDescDone') : t('achievementCvDescTodo'),
      cta: hasCV ? undefined : { label: t('achievementCvCta'), href: '/dashboard/settings' },
    },
    {
      key: 'apply',
      done: hasApplied,
      icon: '🚀',
      title: t('achievementApplyTitle'),
      desc: hasApplied ? t('achievementApplyDescDone', { count: applications.length, suffix: applications.length !== 1 ? 's' : '' }) : t('achievementApplyDescTodo'),
      cta: hasApplied ? undefined : { label: t('achievementApplyCta'), href: '/dashboard' },
    },
    {
      key: 'complete',
      done: pct === 100,
      icon: '⭐',
      title: t('achievementCompleteTitle'),
      desc: pct === 100 ? t('achievementCompleteDescDone') : t('achievementCompleteDescTodo', { pct, missing: missing.join(', ') }),
      cta: pct < 100 ? { label: t('achievementCompleteCta'), href: '/dashboard/settings' } : undefined,
    },
  ]

  const doneCount = achievements.filter(a => a.done).length

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{t('sectionHeading')}</h2>
        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('progressCount', { doneCount, achievementsCount: achievements.length })}</span>
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
