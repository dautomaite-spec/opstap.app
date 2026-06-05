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
    throw new ApiError(res.status, err.detail ?? res.statusText)
  }
  return res.json()
}

export const api = {
  profile: {
    get: () => request<Profile>('GET', '/api/v1/profile/me'),
    create: (body: ProfileCreate) => request<Profile>('POST', '/api/v1/profile/', body),
    update: (body: Partial<ProfileCreate>) => request<Profile>('PATCH', '/api/v1/profile/me', body),
  },
  jobs: {
    search: (params: JobSearchParams) => request<Job[]>('POST', '/api/v1/jobs/search', params),
  },
  apply: {
    generateLetter: (body: LetterRequest) => request<LetterResponse>('POST', '/api/v1/apply/letter', body),
    send: (body: SendRequest) => request<Application>('POST', '/api/v1/apply/send', body),
    history: () => request<Application[]>('GET', '/api/v1/apply/history'),
  },
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

// Types
export interface Profile {
  id: string
  naam: string
  functietitel?: string
  woonplaats?: string
  beschikbaarheid?: string
  uren_per_week?: number
  salaris_min?: number
  salaris_max?: number
  werklocatie?: string
  extra_info?: string
  cv_url?: string
  cv_expires_at?: string
}

export interface ProfileCreate {
  naam: string
  functietitel?: string
  woonplaats?: string
  beschikbaarheid?: string
  uren_per_week?: number
  salaris_min?: number
  salaris_max?: number
  werklocatie?: string
  extra_info?: string
}

export interface Job {
  id: string
  title: string
  company: string
  location: string
  source: string
  url: string
  description_snippet?: string
  salary_range?: string
  contract_type?: string
  scraped_at: string
}

export interface JobSearchParams {
  keywords?: string
  location?: string
  limit?: number
}

export interface LetterRequest {
  job_id: string
  profile_id: string
  writing_style?: string
  custom_notes?: string
}

export interface LetterResponse {
  job_id: string
  letter_nl: string
  generated_at: string
  regenerations_remaining: number
}

export interface SendRequest {
  job_id: string
  profile_id: string
  letter_nl: string
  send_method?: string
}

export interface Application {
  id: string
  job_id: string
  company: string
  job_title: string
  letter_nl: string
  status: string
  created_at: string
}
