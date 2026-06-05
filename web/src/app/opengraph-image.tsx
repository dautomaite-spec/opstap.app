import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Opstap — Meer kansen. Minder moeite.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '80px',
          background: '#F0EEFF',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            fontSize: 32,
            fontWeight: 700,
            color: '#4F46E5',
            marginBottom: 40,
            letterSpacing: '-0.5px',
          }}
        >
          Opstap
        </div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: '#1E1B4B',
            lineHeight: 1.1,
            marginBottom: 32,
            letterSpacing: '-2px',
          }}
        >
          Meer kansen.
          <br />
          Minder moeite.
        </div>
        <div
          style={{
            fontSize: 28,
            color: '#6B7280',
            maxWidth: 700,
            lineHeight: 1.5,
          }}
        >
          Automatisch solliciteren op Nederlandse vacatures met AI-motivatiebrieven.
        </div>
        <div
          style={{
            marginTop: 60,
            padding: '16px 40px',
            background: '#4F46E5',
            borderRadius: 16,
            color: '#fff',
            fontSize: 24,
            fontWeight: 600,
          }}
        >
          Begin gratis →
        </div>
      </div>
    ),
    size,
  )
}
