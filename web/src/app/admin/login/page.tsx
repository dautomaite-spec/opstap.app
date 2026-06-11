import { adminLogin } from '../actions'

export default async function AdminLogin({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f3ff',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: 16,
          padding: '40px 36px',
          width: '100%',
          maxWidth: 360,
          boxShadow: '0 4px 24px rgba(61,58,140,0.10)',
        }}
      >
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#3d3a8c', marginBottom: 4, marginTop: 0 }}>
          Opstap Admin
        </h1>
        <p style={{ fontSize: 13, color: '#888', marginBottom: 28, marginTop: 0 }}>
          Voer de admin-sleutel in om verder te gaan.
        </p>

        {error && (
          <p
            style={{
              fontSize: 13,
              color: '#991b1b',
              background: '#fee2e2',
              borderRadius: 8,
              padding: '8px 12px',
              marginBottom: 16,
            }}
          >
            Onjuiste sleutel. Probeer opnieuw.
          </p>
        )}

        <form action={adminLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            name="key"
            type="password"
            placeholder="Admin-sleutel"
            required
            autoFocus
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              border: '1.5px solid #ddd6fe',
              fontSize: 15,
              outline: 'none',
              color: '#1a1a1a',
            }}
          />
          <button
            type="submit"
            style={{
              background: '#3d3a8c',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              padding: '11px 0',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Inloggen
          </button>
        </form>
      </div>
    </div>
  )
}
