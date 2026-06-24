'use client'

import { useState, useTransition, useCallback } from 'react'
import { adjustCredits, toggleSuspend, deleteUser, adminLogout, fetchInviteCodes, generateInviteCodes, fetchWaitlist, inviteWaitlistEntry, blastReactivation } from './actions'

type InviteUser = { user_id: string; naam: string; used_at: string; applications: number; interviews: number }
type InviteCode = { id: string; code: string; notes?: string; max_uses: number; use_count: number; created_at: string; invite_url: string; users: InviteUser[] }
type WaitlistEntry = { id: string; email: string; naam?: string; created_at: string; invited_at?: string; invite_code?: string }

function generateAdminKey(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

function RotateKeyPanel() {
  const [newKey, setNewKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const generate = useCallback(() => {
    setNewKey(generateAdminKey())
    setCopied(false)
  }, [])

  const copy = useCallback(() => {
    if (!newKey) return
    navigator.clipboard.writeText(newKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [newKey])

  return (
    <div style={{ background: 'white', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 8px rgba(61,58,140,0.08)', marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#3d3a8c' }}>Admin API-sleutel roteren</div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>Genereer een nieuwe sleutel, kopieer hem en plak in Railway → Variables → ADMIN_API_KEY.</div>
        </div>
        <button onClick={generate} style={S.btn('primary')}>Nieuwe sleutel genereren</button>
      </div>
      {newKey && (
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <code style={{ flex: 1, background: '#f5f3ff', borderRadius: 6, padding: '8px 12px', fontSize: 12, wordBreak: 'break-all', color: '#1a1a1a', border: '1.5px solid #ddd6fe' }}>
            {newKey}
          </code>
          <button onClick={copy} style={S.btn(copied ? 'ghost' : 'primary')}>
            {copied ? 'Gekopieerd!' : 'Kopiëren'}
          </button>
        </div>
      )}
      {newKey && (
        <p style={{ margin: '8px 0 0', fontSize: 11, color: '#dc2626' }}>
          Sla de sleutel eerst op in Railway voordat je de pagina verlaat — daarna update ook <code>.env.local</code>.
        </p>
      )}
    </div>
  )
}

interface User {
  user_id: string
  email: string
  naam: string
  credits_balance: number
  is_suspended: boolean
  referral_code?: string
  created_at?: string
  last_active_at?: string
  application_count: number
}

const S = {
  th: {
    padding: '10px 14px',
    textAlign: 'left' as const,
    fontSize: 12,
    fontWeight: 600,
    color: '#888',
    borderBottom: '1.5px solid #e8e5ff',
    whiteSpace: 'nowrap' as const,
  },
  td: {
    padding: '12px 14px',
    fontSize: 13,
    color: '#1a1a1a',
    borderBottom: '1px solid #f0eeff',
    verticalAlign: 'top' as const,
  },
  btn: (variant: 'primary' | 'danger' | 'ghost') => ({
    border: 'none',
    borderRadius: 6,
    padding: '5px 12px',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    background: variant === 'primary' ? '#3d3a8c' : variant === 'danger' ? '#dc2626' : '#f0eeff',
    color: variant === 'ghost' ? '#3d3a8c' : 'white',
  }),
}

function nl(dt?: string) {
  if (!dt) return '—'
  return new Date(dt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
}

function CreditForm({ user, onDone }: { user: User; onDone: () => void }) {
  const [delta, setDelta] = useState('')
  const [reason, setReason] = useState('')
  const [msg, setMsg] = useState('')
  const [pending, startTransition] = useTransition()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const d = parseInt(delta)
    if (!d || !reason.trim()) return
    startTransition(async () => {
      try {
        const res = await adjustCredits(user.user_id, d, reason.trim())
        setMsg(`Nieuw saldo: ${res.new_balance} credits`)
        setDelta('')
        setReason('')
        setTimeout(onDone, 1500)
      } catch (err: unknown) {
        setMsg(err instanceof Error ? err.message : 'Fout')
      }
    })
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12, padding: 12, background: '#f5f3ff', borderRadius: 8 }}>
      <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#3d3a8c' }}>Credits aanpassen — {user.email}</p>
      <p style={{ margin: 0, fontSize: 12, color: '#555' }}>Huidig saldo: {user.credits_balance}</p>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="number"
          placeholder="Aantal (+ of −)"
          value={delta}
          onChange={e => setDelta(e.target.value)}
          required
          style={{ width: 120, padding: '6px 10px', borderRadius: 6, border: '1.5px solid #ddd6fe', fontSize: 13 }}
        />
        <input
          type="text"
          placeholder="Reden (zichtbaar in ledger)"
          value={reason}
          onChange={e => setReason(e.target.value)}
          required
          style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: '1.5px solid #ddd6fe', fontSize: 13 }}
        />
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button type="submit" disabled={pending} style={S.btn('primary')}>
          {pending ? 'Bezig…' : 'Opslaan'}
        </button>
        <button type="button" onClick={onDone} style={S.btn('ghost')}>Annuleren</button>
        {msg && <span style={{ fontSize: 12, color: '#065f46' }}>{msg}</span>}
      </div>
    </form>
  )
}

function UserRow({ user, onRefresh }: { user: User; onRefresh: () => void }) {
  const [showCredits, setShowCredits] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleSuspend() {
    startTransition(async () => {
      await toggleSuspend(user.user_id, !user.is_suspended)
      onRefresh()
    })
  }

  function handleDelete() {
    if (!confirm(`Weet je zeker dat je ${user.email} wilt verwijderen? Dit kan niet ongedaan worden gemaakt.`)) return
    startTransition(async () => {
      await deleteUser(user.user_id)
      onRefresh()
    })
  }

  return (
    <>
      <tr style={{ opacity: pending ? 0.5 : 1 }}>
        <td style={S.td}>
          <div style={{ fontWeight: 600 }}>{user.naam}</div>
          <div style={{ fontSize: 12, color: '#888' }}>{user.email}</div>
          {user.is_suspended && (
            <span style={{ fontSize: 11, background: '#fee2e2', color: '#991b1b', borderRadius: 4, padding: '1px 5px' }}>Geschorst</span>
          )}
        </td>
        <td style={S.td}>{user.credits_balance}</td>
        <td style={S.td}>{user.application_count}</td>
        <td style={S.td}>{nl(user.created_at)}</td>
        <td style={S.td}>{nl(user.last_active_at)}</td>
        <td style={{ ...S.td, whiteSpace: 'nowrap' as const }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
            <button style={S.btn('ghost')} onClick={() => setShowCredits(v => !v)}>
              Credits
            </button>
            <button style={S.btn('ghost')} onClick={handleSuspend} disabled={pending}>
              {user.is_suspended ? 'Herstel' : 'Schors'}
            </button>
            <button style={S.btn('danger')} onClick={handleDelete} disabled={pending}>
              Verwijder
            </button>
          </div>
        </td>
      </tr>
      {showCredits && (
        <tr>
          <td colSpan={6} style={{ padding: '0 14px 12px', borderBottom: '1px solid #f0eeff' }}>
            <CreditForm user={user} onDone={() => { setShowCredits(false); onRefresh() }} />
          </td>
        </tr>
      )}
    </>
  )
}

function InvitePanel() {
  const [codes, setCodes] = useState<InviteCode[]>([])
  const [loaded, setLoaded] = useState(false)
  const [count, setCount] = useState('1')
  const [notes, setNotes] = useState('')
  const [maxUses, setMaxUses] = useState('1')
  const [generating, setGenerating] = useState(false)
  const [newCodes, setNewCodes] = useState<string[]>([])
  const [, startTransition] = useTransition()
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)

  function load() {
    startTransition(async () => {
      const data = await fetchInviteCodes()
      setCodes(data)
      setLoaded(true)
    })
  }

  if (!loaded) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <button onClick={load} style={S.btn('primary')}>Uitnodigingscodes laden</button>
      </div>
    )
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    setGenerating(true)
    setNewCodes([])
    try {
      const res = await generateInviteCodes(parseInt(count) || 1, notes.trim(), parseInt(maxUses) || 1)
      setNewCodes(res.codes || [])
      const fresh = await fetchInviteCodes()
      setCodes(fresh)
      setNotes('')
      setCount('1')
    } finally {
      setGenerating(false)
    }
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url)
    setCopiedUrl(url)
    setTimeout(() => setCopiedUrl(null), 2000)
  }

  return (
    <div>
      {/* Generate form */}
      <div style={{ background: 'white', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 8px rgba(61,58,140,0.08)', marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#3d3a8c', marginBottom: 12 }}>Nieuwe uitnodigingscodes genereren</div>
        <form onSubmit={handleGenerate} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, color: '#888' }}>Aantal</label>
            <input type="number" min="1" max="50" value={count} onChange={e => setCount(e.target.value)}
              style={{ width: 70, padding: '6px 10px', borderRadius: 6, border: '1.5px solid #ddd6fe', fontSize: 13 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, color: '#888' }}>Max gebruik</label>
            <input type="number" min="1" max="100" value={maxUses} onChange={e => setMaxUses(e.target.value)}
              style={{ width: 80, padding: '6px 10px', borderRadius: 6, border: '1.5px solid #ddd6fe', fontSize: 13 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 180 }}>
            <label style={{ fontSize: 11, color: '#888' }}>Label (intern)</label>
            <input type="text" placeholder="bijv. LinkedIn post juni" value={notes} onChange={e => setNotes(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: 6, border: '1.5px solid #ddd6fe', fontSize: 13 }} />
          </div>
          <button type="submit" disabled={generating} style={S.btn('primary')}>
            {generating ? 'Bezig…' : 'Genereren'}
          </button>
        </form>
        {newCodes.length > 0 && (
          <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {newCodes.map(c => (
              <code key={c} style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 6, padding: '4px 10px', fontSize: 13, fontWeight: 700, color: '#065f46' }}>
                {c}
              </code>
            ))}
          </div>
        )}
      </div>

      {/* Codes table */}
      <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 1px 8px rgba(61,58,140,0.08)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f3ff' }}>
              <th style={S.th}>Code</th>
              <th style={S.th}>Label</th>
              <th style={S.th}>Gebruik</th>
              <th style={S.th}>Gebruikers</th>
              <th style={S.th}>Aangemaakt</th>
              <th style={S.th}>Link</th>
            </tr>
          </thead>
          <tbody>
            {codes.length === 0 ? (
              <tr><td colSpan={6} style={{ ...S.td, textAlign: 'center', color: '#888', padding: '32px 0' }}>Geen codes.</td></tr>
            ) : codes.map(c => (
              <tr key={c.id}>
                <td style={S.td}>
                  <code style={{ background: '#f5f3ff', borderRadius: 4, padding: '2px 6px', fontSize: 13, fontWeight: 700, color: '#3d3a8c' }}>{c.code}</code>
                </td>
                <td style={{ ...S.td, fontSize: 12, color: '#888' }}>{c.notes || '—'}</td>
                <td style={S.td}>
                  <span style={{ fontWeight: c.use_count >= c.max_uses ? 700 : 400, color: c.use_count >= c.max_uses ? '#dc2626' : undefined }}>
                    {c.use_count}/{c.max_uses}
                  </span>
                </td>
                <td style={S.td}>
                  {c.users.length === 0 ? <span style={{ color: '#aaa', fontSize: 12 }}>—</span> : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {c.users.map(u => (
                        <div key={u.user_id} style={{ fontSize: 12 }}>
                          <span style={{ fontWeight: 600 }}>{u.naam || '—'}</span>
                          <span style={{ color: '#888', marginLeft: 6 }}>
                            {u.applications} sollicitaties · {u.interviews} gesprekken
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </td>
                <td style={{ ...S.td, fontSize: 12 }}>{nl(c.created_at)}</td>
                <td style={S.td}>
                  <button onClick={() => copyUrl(c.invite_url)} style={S.btn(copiedUrl === c.invite_url ? 'ghost' : 'primary')}>
                    {copiedUrl === c.invite_url ? 'Gekopieerd!' : 'Kopieer link'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function WaitlistPanel() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([])
  const [loaded, setLoaded] = useState(false)
  const [inviting, setInviting] = useState<string | null>(null)
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  function load() {
    startTransition(async () => {
      const data = await fetchWaitlist()
      setEntries(data)
      setLoaded(true)
    })
  }

  if (!loaded) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <button onClick={load} style={S.btn('primary')}>Wachtlijst laden</button>
      </div>
    )
  }

  async function handleInvite(entry: WaitlistEntry) {
    if (entry.invited_at) return
    setInviting(entry.id)
    try {
      const res = await inviteWaitlistEntry(entry.id)
      const url = res.invite_url as string
      navigator.clipboard.writeText(url).catch(() => {})
      setCopiedUrl(url)
      setTimeout(() => setCopiedUrl(null), 3000)
      const fresh = await fetchWaitlist()
      setEntries(fresh)
    } finally {
      setInviting(null)
    }
  }

  return (
    <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 1px 8px rgba(61,58,140,0.08)', overflow: 'hidden' }}>
      {copiedUrl && (
        <div style={{ padding: '10px 16px', background: '#f0fdf4', borderBottom: '1px solid #bbf7d0', fontSize: 12, color: '#065f46', fontWeight: 600 }}>
          Link gekopieerd: {copiedUrl}
        </div>
      )}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f5f3ff' }}>
            <th style={S.th}>Naam</th>
            <th style={S.th}>E-mail</th>
            <th style={S.th}>Aangemeld</th>
            <th style={S.th}>Status</th>
            <th style={S.th}>Actie</th>
          </tr>
        </thead>
        <tbody>
          {entries.length === 0 ? (
            <tr><td colSpan={5} style={{ ...S.td, textAlign: 'center', color: '#888', padding: '32px 0' }}>Wachtlijst is leeg.</td></tr>
          ) : entries.map(e => (
            <tr key={e.id}>
              <td style={S.td}>{e.naam || '—'}</td>
              <td style={S.td}>{e.email}</td>
              <td style={{ ...S.td, fontSize: 12 }}>{nl(e.created_at)}</td>
              <td style={S.td}>
                {e.invited_at ? (
                  <div>
                    <span style={{ fontSize: 11, background: '#d1fae5', color: '#065f46', borderRadius: 4, padding: '1px 6px', fontWeight: 600 }}>Uitgenodigd</span>
                    {e.invite_code && (
                      <code style={{ display: 'block', fontSize: 11, color: '#888', marginTop: 2 }}>{e.invite_code}</code>
                    )}
                  </div>
                ) : (
                  <span style={{ fontSize: 11, background: '#fef3c7', color: '#92400e', borderRadius: 4, padding: '1px 6px', fontWeight: 600 }}>Wacht</span>
                )}
              </td>
              <td style={S.td}>
                {!e.invited_at && (
                  <button
                    onClick={() => handleInvite(e)}
                    disabled={inviting === e.id}
                    style={S.btn('primary')}
                  >
                    {inviting === e.id ? 'Bezig…' : 'Uitnodigen'}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function AdminPanel({ initialUsers }: { initialUsers: User[] }) {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'users' | 'invites' | 'waitlist'>('users')
  const [, startTransition] = useTransition()
  const [blastState, setBlastState] = useState<'idle' | 'sending' | 'done'>('idle')

  function refresh() {
    startTransition(async () => {
      const { fetchUsers } = await import('./actions')
      const fresh = await fetchUsers()
      setUsers(fresh)
    })
  }

  const filtered = users.filter(u =>
    !search || u.email.toLowerCase().includes(search.toLowerCase()) || u.naam.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: 32, maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#3d3a8c' }}>Opstap Admin</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#888' }}>{users.length} gebruiker{users.length !== 1 ? 's' : ''}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={async () => {
              if (blastState !== 'idle') return
              if (!confirm(`Reactivation email sturen naar alle ${users.length} gebruikers?`)) return
              setBlastState('sending')
              try {
                await blastReactivation()
                setBlastState('done')
              } catch { setBlastState('idle') }
            }}
            disabled={blastState !== 'idle'}
            style={{ ...S.btn('primary'), fontSize: 12, opacity: blastState !== 'idle' ? 0.6 : 1 }}
          >
            {blastState === 'sending' ? 'Versturen…' : blastState === 'done' ? 'Verstuurd!' : 'Reactivation email'}
          </button>
          <form action={adminLogout}>
            <button type="submit" style={{ ...S.btn('ghost'), fontSize: 13 }}>Uitloggen</button>
          </form>
        </div>
      </div>

      {/* Stats strip */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' as const }}>
        {[
          { label: 'Totaal gebruikers', value: users.length },
          { label: 'Gesuspendeerd', value: users.filter(u => u.is_suspended).length },
          { label: 'Totaal sollicitaties', value: users.reduce((s, u) => s + u.application_count, 0) },
          { label: 'Totale credits uitstaand', value: users.reduce((s, u) => s + u.credits_balance, 0) },
        ].map(stat => (
          <div key={stat.label} style={{ background: 'white', borderRadius: 10, padding: '14px 20px', boxShadow: '0 1px 8px rgba(61,58,140,0.08)', minWidth: 140 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#3d3a8c' }}>{stat.value}</div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid #e8e5ff', paddingBottom: 0 }}>
        {([['users', 'Gebruikers'], ['invites', 'Uitnodigingen'], ['waitlist', 'Wachtlijst']] as const).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              border: 'none', background: 'none', padding: '8px 16px', fontSize: 13, fontWeight: tab === t ? 700 : 400,
              color: tab === t ? '#3d3a8c' : '#888', cursor: 'pointer',
              borderBottom: tab === t ? '2px solid #3d3a8c' : '2px solid transparent',
              marginBottom: -2,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'users' && (
        <>
          {/* Rotate admin key */}
          <RotateKeyPanel />

          {/* Search */}
          <input
            placeholder="Zoek op e-mail of naam…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 14px',
              borderRadius: 8,
              border: '1.5px solid #ddd6fe',
              fontSize: 14,
              marginBottom: 16,
              boxSizing: 'border-box' as const,
              outline: 'none',
            }}
          />

          {/* Table */}
          <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 1px 8px rgba(61,58,140,0.08)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f3ff' }}>
                  <th style={S.th}>Gebruiker</th>
                  <th style={S.th}>Credits</th>
                  <th style={S.th}>Sollicitaties</th>
                  <th style={S.th}>Aangemeld</th>
                  <th style={S.th}>Laatste activiteit</th>
                  <th style={S.th}>Acties</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ ...S.td, textAlign: 'center', color: '#888', padding: '32px 0' }}>
                      Geen gebruikers gevonden.
                    </td>
                  </tr>
                ) : (
                  filtered.map(u => (
                    <UserRow key={u.user_id} user={u} onRefresh={refresh} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'invites' && <InvitePanel />}
      {tab === 'waitlist' && <WaitlistPanel />}
    </div>
  )
}
