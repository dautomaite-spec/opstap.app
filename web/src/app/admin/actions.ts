'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createHash } from 'crypto'

const API = process.env.NEXT_PUBLIC_API_URL!
const ADMIN_KEY = process.env.ADMIN_API_KEY!

function adminHeaders() {
  return {
    'Content-Type': 'application/json',
    'X-Admin-Key': ADMIN_KEY,
  }
}

export async function adminLogin(formData: FormData) {
  const key = formData.get('key') as string
  if (!ADMIN_KEY || key !== ADMIN_KEY) {
    redirect('/admin/login?error=1')
  }
  const token = createHash('sha256').update(ADMIN_KEY).digest('hex')
  const cookieStore = await cookies()
  cookieStore.set('admin_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 8, // 8 hours
    path: '/',
  })
  redirect('/admin')
}

export async function adminLogout() {
  const cookieStore = await cookies()
  cookieStore.delete('admin_session')
  redirect('/admin/login')
}

export async function fetchUsers() {
  const res = await fetch(`${API}/api/v1/admin/users`, {
    headers: adminHeaders(),
    cache: 'no-store',
  })
  if (!res.ok) return []
  return res.json()
}

export async function adjustCredits(userId: string, delta: number, reason: string) {
  const res = await fetch(`${API}/api/v1/admin/users/${userId}/credits`, {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify({ delta, reason }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail ?? 'Credits aanpassen mislukt')
  }
  return res.json()
}

export async function toggleSuspend(userId: string, suspended: boolean) {
  const res = await fetch(`${API}/api/v1/admin/users/${userId}/suspend`, {
    method: 'PATCH',
    headers: adminHeaders(),
    body: JSON.stringify({ suspended }),
  })
  if (!res.ok) throw new Error('Actie mislukt')
  return res.json()
}

export async function deleteUser(userId: string) {
  const res = await fetch(`${API}/api/v1/admin/users/${userId}`, {
    method: 'DELETE',
    headers: adminHeaders(),
  })
  if (!res.ok) throw new Error('Verwijderen mislukt')
  return res.json()
}

export async function fetchInviteCodes() {
  const res = await fetch(`${API}/api/v1/invite/codes`, {
    headers: adminHeaders(),
    cache: 'no-store',
  })
  if (!res.ok) return []
  return res.json()
}

export async function generateInviteCodes(count: number, notes: string, maxUses: number) {
  const res = await fetch(`${API}/api/v1/invite/codes`, {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify({ count, notes, max_uses: maxUses }),
  })
  if (!res.ok) throw new Error('Genereren mislukt')
  return res.json()
}

export async function fetchWaitlist() {
  const res = await fetch(`${API}/api/v1/invite/waitlist`, {
    headers: adminHeaders(),
    cache: 'no-store',
  })
  if (!res.ok) return []
  return res.json()
}

export async function inviteWaitlistEntry(id: string) {
  const res = await fetch(`${API}/api/v1/invite/waitlist/${id}/invite`, {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify({}),
  })
  if (!res.ok) throw new Error('Uitnodigen mislukt')
  return res.json()
}

export async function blastReactivation(): Promise<{ queued: number }> {
  const res = await fetch(`${API}/api/v1/admin/blast/reactivation`, {
    method: 'POST',
    headers: adminHeaders(),
  })
  if (!res.ok) throw new Error('Blast mislukt')
  return res.json()
}
