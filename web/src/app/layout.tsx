import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import Script from 'next/script'
import './globals.css'

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })

const siteUrl = 'https://opstapapp.nl'

export const metadata: Metadata = {
  title: 'Opstap — Meer kansen. Minder moeite.',
  description: 'Automatisch solliciteren op Nederlandse vacatures. Upload je CV, zoek vacatures en solliciteer met een AI-geschreven motivatiebrief.',
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: 'Opstap — Meer kansen. Minder moeite.',
    description: 'Automatisch solliciteren op Nederlandse vacatures. Upload je CV, zoek vacatures en solliciteer met een AI-geschreven motivatiebrief.',
    url: siteUrl,
    siteName: 'Opstap',
    locale: 'nl_NL',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Opstap — Meer kansen. Minder moeite.',
    description: 'Automatisch solliciteren op Nederlandse vacatures. Upload je CV, zoek vacatures en solliciteer met een AI-geschreven motivatiebrief.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

const themeScript = `
(function(){try{if(localStorage.getItem('theme')==='dark'){document.documentElement.classList.add('dark')}}catch(e){}})();
`.trim()

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={`${geist.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <Script
          defer
          data-domain="opstapapp.nl"
          src="https://plausible.io/js/script.js"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
