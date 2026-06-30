'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useTranslations } from 'next-intl'

export default function ResetPasswordPage() {
  const t = useTranslations('ResetPasswordPage')
  const router = useRouter()
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const fd = new FormData(e.currentTarget)
    const password = fd.get('password') as string
    const confirm = fd.get('confirm') as string

    if (password !== confirm) {
      setError(t('errorPasswordMismatch'))
      setSaving(false)
      return
    }

    const supabase = createClient()
    const { error: err } = await supabase.auth.updateUser({ password })
    if (err) {
      setError(t('errorSaveFailed'))
      setSaving(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--color-lavender-bg)' }}>
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center font-bold text-2xl mb-8" style={{ color: 'var(--color-indigo-primary)' }}>
          Opstap
        </Link>

        <div className="rounded-2xl p-8" style={{ background: 'var(--color-white)', boxShadow: '0 2px 16px rgba(61,58,140,0.08)' }}>
          <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            {t('pageTitle')}
          </h1>
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
            {t('pageDescription')}
          </p>

          {error && (
            <p className="text-sm mb-4 px-3 py-2 rounded-lg" style={{ background: '#fef2f2', color: 'var(--color-error)' }}>
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="password" className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {t('newPasswordLabel')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="px-3 py-2 rounded-lg border text-sm outline-none transition focus:ring-2"
                style={{
                  borderColor: 'var(--color-lavender-card)',
                  color: 'var(--color-text-primary)',
                  background: 'var(--color-lavender-bg)',
                }}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="confirm" className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {t('confirmPasswordLabel')}
              </label>
              <input
                id="confirm"
                name="confirm"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="px-3 py-2 rounded-lg border text-sm outline-none transition focus:ring-2"
                style={{
                  borderColor: 'var(--color-lavender-card)',
                  color: 'var(--color-text-primary)',
                  background: 'var(--color-lavender-bg)',
                }}
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="mt-1 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
              style={{ background: 'var(--color-indigo-primary)' }}
            >
              {saving ? t('saveButtonSaving') : t('saveButtonIdle')}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
