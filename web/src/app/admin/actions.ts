'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL!

async function getAdminKey(): Promise<string> {
  const cookieStore = await cookies()
  return cookieStore.get('admin_key')?.value ?? ''
}

async function adminHeaders() {
  const key = await getAdminKey()
  return {
    'Content-Type': 'application/json',
    'X-Admin-Key': key,
  }
}

export async function adminLogin(formData: FormData) {
  const key = formData.get('key') as string
  if (!key?.trim()) redirect('/admin/login?error=1')

  const res = await fetch(`${API}/api/v1/admin/users?limit=1`, {
    headers: { 'Content-Type': 'application/json', 'X-Admin-Key': key },
    cache: 'no-store',
  })
  if (!res.ok) redirect('/admin/login?error=1')

  const cookieStore = await cookies()
  cookieStore.set('admin_key', key, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 8,
    path: '/',
  })
  redirect('/admin')
}

export async function adminLogout() {
  const cookieStore = await cookies()
  cookieStore.delete('admin_key')
  redirect('/admin/login')
}

export async function fetchUsers() {
  const res = await fetch(`${API}/api/v1/admin/users`, {
    headers: await adminHeaders(),
    cache: 'no-store',
  })
  if (!res.ok) return []
  return res.json()
}

export async function adjustCredits(userId: string, delta: number, reason: string) {
  const res = await fetch(`${API}/api/v1/admin/users/${userId}/credits`, {
    method: 'POST',
    headers: await adminHeaders(),
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
    headers: await adminHeaders(),
    body: JSON.stringify({ suspended }),
  })
  if (!res.ok) throw new Error('Actie mislukt')
  return res.json()
}

export async function deleteUser(userId: string) {
  const res = await fetch(`${API}/api/v1/admin/users/${userId}`, {
    method: 'DELETE',
    headers: await adminHeaders(),
  })
  if (!res.ok) throw new Error('Verwijderen mislukt')
  return res.json()
}

export async function fetchInviteCodes() {
  const res = await fetch(`${API}/api/v1/invite/codes`, {
    headers: await adminHeaders(),
    cache: 'no-store',
  })
  if (!res.ok) return []
  return res.json()
}

export async function generateInviteCodes(count: number, notes: string, maxUses: number) {
  const res = await fetch(`${API}/api/v1/invite/codes`, {
    method: 'POST',
    headers: await adminHeaders(),
    body: JSON.stringify({ count, notes, max_uses: maxUses }),
  })
  if (!res.ok) throw new Error('Genereren mislukt')
  return res.json()
}

export async function fetchWaitlist() {
  const res = await fetch(`${API}/api/v1/invite/waitlist`, {
    headers: await adminHeaders(),
    cache: 'no-store',
  })
  if (!res.ok) return []
  return res.json()
}

export async function inviteWaitlistEntry(id: string) {
  const res = await fetch(`${API}/api/v1/invite/waitlist/${id}/invite`, {
    method: 'POST',
    headers: await adminHeaders(),
    body: JSON.stringify({}),
  })
  if (!res.ok) throw new Error('Uitnodigen mislukt')
  return res.json()
}

export async function blastReactivation(): Promise<{ queued: number }> {
  const res = await fetch(`${API}/api/v1/admin/blast/reactivation`, {
    method: 'POST',
    headers: await adminHeaders(),
  })
  if (!res.ok) throw new Error('Blast mislukt')
  return res.json()
}
