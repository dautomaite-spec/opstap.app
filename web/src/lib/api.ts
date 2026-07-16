import { createClient } from '@/lib/supabase/client'

const BASE = process.env.NEXT_PUBLIC_API_URL!

async function getToken(): Promise<string | null> {
  const supabase = createClient()
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = await getToken()
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    const d = err.detail
    if (d && typeof d === 'object') {
      throw new ApiError(res.status, d.message ?? res.statusText, d.code)
    }
    throw new ApiError(res.status, d ?? res.statusText)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  invite: {
    joinWaitlist: (body: { email: string; naam?: string }) =>
      request<{ message: string }>('POST', '/api/v1/invite/waitlist', body),
    validate: (code: string) =>
      request<{ valid: boolean; code: string }>('GET', `/api/v1/invite/validate/${code}`),
    redeem: (code: string) =>
      request<{ redeemed: boolean }>('POST', '/api/v1/invite/redeem', { code }),
    // Admin
    generateCodes: (body: { count?: number; notes?: string; max_uses?: number }) =>
      request<{ codes: string[]; count: number }>('POST', '/api/v1/invite/codes', body),
    listCodes: () => request<InviteCode[]>('GET', '/api/v1/invite/codes'),
    listWaitlist: () => request<WaitlistEntry[]>('GET', '/api/v1/invite/waitlist'),
    inviteWaitlistEntry: (id: string, notes?: string) =>
      request<{ code: string; invite_url: string; email: string }>('POST', `/api/v1/invite/waitlist/${id}/invite`, { notes }),
  },
  credits: {
    balance: () => request<BalanceOut>('GET', '/api/v1/credits/balance'),
    transactions: () => request<TransactionOut[]>('GET', '/api/v1/credits/transactions'),
  },
  profile: {
    get: () => request<Profile>('GET', '/api/v1/profile/me'),
    create: (body: ProfileCreate) => request<Profile>('POST', '/api/v1/profile/', body),
    update: (body: Partial<ProfileCreate>) => request<Profile>('PATCH', '/api/v1/profile/me', body),
    uploadCV: async (file: File, retentionDays = 30, avgConsent = true) => {
      const token = await getToken()
      const fd = new FormData()
      fd.append('file', file)
      fd.append('retention_days', String(retentionDays))
      fd.append('avg_consent', avgConsent ? 'true' : 'false')
      const res = await fetch(`${BASE}/api/v1/profile/cv`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }))
        throw new ApiError(res.status, err.detail ?? res.statusText)
      }
      return res.json() as Promise<{ message: string; expires_at: string }>
    },
    deleteCV: () => request<void>('DELETE', '/api/v1/profile/cv'),
    applyCV: () => request<Profile>('POST', '/api/v1/profile/apply-cv'),
    deleteAccount: () => request<void>('DELETE', '/api/v1/profile/me'),
    exportData: async () => {
      const token = await getToken()
      const res = await fetch(`${BASE}/api/v1/profile/export`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }))
        throw new ApiError(res.status, err.detail ?? res.statusText)
      }
      return res.blob()
    },
  },
  apply: {
    fromUrl: (url: string, writing_style?: string, job_text?: string) => request<{ job_title: string; company: string; description_snippet: string; letter: string; application_id: string; job_id: string }>('POST', '/api/v1/apply/from-url', { url, writing_style: writing_style ?? 'formeel', ...(job_text !== undefined ? { job_text } : {}) }),
    /** Approval gate — requires the draft created by fromUrl */
    approve: (application_id: string, body: ApproveRequest) =>
      request<Application>('POST', `/api/v1/apply/${application_id}/approve`, body),
    history: () => request<Application[]>('GET', '/api/v1/apply/history'),
    stats: () => request<{ sent: number; replied: number; interview: number; accepted: number }>('GET', '/api/v1/apply/stats'),
    updateStatus: (id: string, status: string) =>
      request<Application>('PATCH', `/api/v1/apply/${id}/status`, { status }),
    rateLetter: (id: string, rating: 1 | -1) =>
      request<void>('PATCH', `/api/v1/apply/${id}/rating`, { rating }),
    retry: (application_id: string) =>
      request<Application>('POST', `/api/v1/apply/${application_id}/approve`, { send_method: 'email' }),
  },
}

export class ApiError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message)
  }
}

// Types
export interface Profile {
  id: string
  naam: string
  functietitel?: string
  functietitel_2?: string
  functietitel_3?: string
  woonplaats?: string
  beschikbaarheid?: string
  uren_per_week?: number
  salaris_min?: number
  salaris_max?: number
  werklocatie?: string
  extra_info?: string
  job_preferences?: string
  job_background?: string
  job_company_size?: string
  job_culture?: string
  job_role_type?: string
  job_avoids?: string
  job_search_summary?: string
  job_search_summary_approved_at?: string
  leeftijd?: number
  brief_taal?: string
  cv_url?: string
  cv_expires_at?: string
  cv_parsed?: boolean
  opleidingsniveau?: string
  credits_balance?: number
  referral_code?: string
  profile_bonus_given?: boolean
  email_reminders_enabled?: boolean
  cv_expiry_reminder_enabled?: boolean
}

export interface BalanceOut {
  balance: number
  referral_code: string | null
}

export interface TransactionOut {
  id: string
  delta: number
  reason: string
  reference_id?: string
  created_at: string
}

export interface ProfileCreate {
  naam: string
  functietitel?: string
  functietitel_2?: string
  functietitel_3?: string
  woonplaats?: string
  beschikbaarheid?: string
  uren_per_week?: number
  salaris_min?: number
  salaris_max?: number
  werklocatie?: string
  extra_info?: string
  job_preferences?: string
  job_background?: string
  job_company_size?: string
  job_culture?: string
  job_role_type?: string
  job_avoids?: string
  opleidingsniveau?: string
  leeftijd?: number
  brief_taal?: string
  email_reminders_enabled?: boolean
  cv_expiry_reminder_enabled?: boolean
}

export interface ApproveRequest {
  send_method: 'email' | 'form' | 'site'
  contact_email_override?: string
  letter_nl?: string  // user's inline edits
}

export interface InviteCode {
  id: string
  code: string
  notes?: string
  max_uses: number
  use_count: number
  created_at: string
  expires_at?: string
  invite_url: string
  users: InviteUser[]
}

export interface InviteUser {
  user_id: string
  naam: string
  used_at: string
  applications: number
  interviews: number
  last_active_at?: string
}

export interface WaitlistEntry {
  id: string
  email: string
  naam?: string
  created_at: string
  invited_at?: string
  invite_code?: string
}

export interface Application {
  id: string
  job_id: string
  company: string
  job_title: string
  letter_nl: string
  status: string
  sent_at?: string
  replied_at?: string
  created_at: string
  job_location?: string
  job_salary?: string
  job_hours?: string
  letter_rating?: 1 | -1 | null
  interview_prep?: InterviewPrep | null
}

export interface InterviewPrep {
  company_summary?: string
  likely_questions?: string[]
  questions_to_ask?: string[]
  tips?: string[]
}
