import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Misbruik melden — Opstap',
  description: 'Meld misbruik van het Opstap platform.',
  robots: { index: false, follow: false },
}

export default function MisbruikPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16" style={{ background: 'var(--color-lavender-bg)' }}>
      <div className="w-full max-w-md">
        <Link href="/" className="text-sm hover:underline mb-8 inline-block" style={{ color: 'var(--color-text-muted)' }}>
          ← Terug naar Opstap
        </Link>
        <h1 className="text-2xl font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>
          Misbruik melden
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
          Heb je spam, ongewenste sollicitaties of ander misbruik van het Opstap platform ontvangen? Laat het ons weten. We nemen dit serieus en handelen snel.
        </p>

        <div className="rounded-xl p-5 mb-6" style={{ background: 'var(--color-lavender-card)' }}>
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
            Stuur een e-mail naar
          </p>
          <a
            href="mailto:misbruik@opstapapp.nl"
            className="text-sm font-medium hover:underline"
            style={{ color: 'var(--color-indigo-primary)' }}
          >
            misbruik@opstapapp.nl
          </a>
          <p className="text-xs mt-3" style={{ color: 'var(--color-text-muted)' }}>
            Vermeld zo veel mogelijk: de datum en het tijdstip, de naam of het e-mailadres van de afzender, en een korte beschrijving van wat er is gebeurd. We streven naar een reactie binnen 2 werkdagen.
          </p>
        </div>

        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          Als je account ten onrechte is geschorst, stuur dan ook een e-mail naar{' '}
          <a href="mailto:misbruik@opstapapp.nl" className="hover:underline" style={{ color: 'var(--color-indigo-primary)' }}>
            misbruik@opstapapp.nl
          </a>{' '}
          met je e-mailadres en een uitleg. We beoordelen elk geval individueel.
        </p>
      </div>
    </div>
  )
}
