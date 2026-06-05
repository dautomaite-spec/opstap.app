import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import Script from 'next/script'
import './globals.css'

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Opstap — Meer kansen. Minder moeite.',
  description: 'Automatisch solliciteren op Nederlandse vacatures. Upload je CV, zoek vacatures en solliciteer met een AI-geschreven motivatiebrief.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={`${geist.variable} h-full antialiased`}>
      <head>
        <Script
          defer
          data-domain="opstap.nl"
          src="https://plausible.io/js/script.js"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
