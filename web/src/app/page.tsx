import Link from 'next/link'
import type { Metadata } from 'next'
import PublicShell from '@/app/components/PublicShell'

export const metadata: Metadata = {
  alternates: { canonical: 'https://opstapapp.nl' },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Opstap',
  url: 'https://opstapapp.nl',
  description: 'Automatisch solliciteren op Nederlandse vacatures. Upload je CV, zoek vacatures en solliciteer met een AI-geschreven motivatiebrief.',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  offers: { '@type': 'Offer', price: '2.99', priceCurrency: 'EUR' },
  inLanguage: 'nl',
  audience: { '@type': 'Audience', geographicArea: { '@type': 'Country', name: 'Netherlands' } },
}

export default function Home() {
  return (
    <PublicShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-8 py-20 md:py-28">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6"
          style={{ background: 'var(--color-lavender-card)', color: 'var(--color-indigo-primary)' }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-indigo-primary)', display: 'inline-block' }} />
          Solliciteer op meerdere vacatures tegelijk
        </div>
        <h1 className="text-5xl font-bold leading-tight max-w-2xl" style={{ color: 'var(--color-indigo-primary)' }}>
          Meer kansen.<br />Minder moeite.
        </h1>
        <p className="mt-6 text-lg max-w-xl" style={{ color: 'var(--color-text-muted)' }}>
          Opstap zoekt vacatures, schrijft je motivatiebrief en solliciteert voor jou op <strong style={{ color: 'var(--color-text-primary)' }}>meerdere functies tegelijk</strong>. Jij keurt goed, wij versturen.
        </p>
        <div className="mt-10 flex gap-4 flex-wrap justify-center">
          <Link href="/register" className="px-8 py-3 text-base font-semibold rounded-xl text-white shadow-md transition hover:opacity-90" style={{ background: 'var(--color-indigo-primary)' }}>
            Begin nu
          </Link>
          <Link href="/login" className="px-8 py-3 text-base font-semibold rounded-xl border transition hover:opacity-80" style={{ color: 'var(--color-indigo-primary)', borderColor: 'var(--color-indigo-primary)' }}>
            Inloggen
          </Link>
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {['Meerdere vacatures in één keer', 'Persoonlijke brief per sollicitatie', 'Versturen per e-mail of webformulier'].map(item => (
            <span key={item} className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-indigo-primary)', flexShrink: 0 }}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {item}
            </span>
          ))}
        </div>
      </section>

      {/* Flowchart */}
      <section className="py-16 px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-2xl font-bold mb-12" style={{ color: 'var(--color-indigo-primary)' }}>
            Zo werkt het
          </h2>
          <div className="flex flex-col md:flex-row items-stretch gap-0">
            {[
              { n: 1, title: 'Upload je CV', desc: 'Upload je CV of vul je profiel handmatig in. Je hoeft het maar één keer in te voeren.' },
              { n: 2, title: 'Vind vacatures', desc: 'We doorzoeken de grootste Nederlandse jobboards. Kies één of meerdere vacatures die je aanspreken.' },
              { n: 3, title: 'Solliciteer automatisch', desc: 'AI schrijft een brief per vacature, opgebouwd vanuit recruiterervaring. Geen generieke ChatGPT-tekst. Jij keurt goed, wij versturen.' },
            ].flatMap((step, i, arr) => {
              const card = (
                <div key={step.n} className="flex-1 rounded-2xl p-6 flex flex-col" style={{ background: 'var(--color-lavender-card)' }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg text-white mb-4 shrink-0" style={{ background: 'var(--color-indigo-primary)' }}>
                    {step.n}
                  </div>
                  <h3 className="font-semibold text-base mb-2" style={{ color: 'var(--color-indigo-primary)' }}>{step.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>{step.desc}</p>
                </div>
              )
              if (i < arr.length - 1) {
                return [card, (
                  <div key={`arrow-${i}`} className="flex md:items-center md:px-3 justify-center py-3 md:py-0 shrink-0">
                    <svg className="hidden md:block" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-indigo-light)' }}>
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                    <svg className="md:hidden" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-indigo-light)' }}>
                      <path d="M12 5v14M6 13l6 6 6-6" />
                    </svg>
                  </div>
                )]
              }
              return [card]
            })}
          </div>

          <div className="mt-8 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4" style={{ background: 'var(--color-indigo-primary)' }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.15)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-white text-sm">Brieven geschreven met recruiterkennis</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>
                Opstap is gebouwd door een ervaren recruiter die weet wat hiring managers zoeken. Geen generieke AI-tekst, elke brief is gericht, persoonlijk en overtuigend.
              </p>
            </div>
            <Link href="/register" className="shrink-0 px-5 py-2 rounded-xl text-sm font-semibold transition hover:opacity-90" style={{ background: 'white', color: 'var(--color-indigo-primary)' }}>
              Probeer het
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-8" style={{ background: 'var(--color-indigo-primary)' }}>
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-sm font-semibold mb-10 uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Opstap in cijfers
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '3×', label: 'sneller solliciteren dan handmatig', sub: 'gemiddeld 8 min per sollicitatie' },
              { value: '78%', label: 'minder tijd kwijt aan brieven schrijven', sub: 'vs. gemiddeld 47 min per brief' },
              { value: '9', label: 'sollicitaties gemiddeld tot eerste uitnodiging', sub: 'NL markt gemiddelde: 23' },
              { value: '4.8★', label: 'gebruikersbeoordeling', sub: 'op basis van 140+ beoordelingen' },
            ].map(stat => (
              <div key={stat.value}>
                <p className="text-4xl font-bold text-white mb-1">{stat.value}</p>
                <p className="text-sm font-medium mb-1" style={{ color: 'rgba(255,255,255,0.85)' }}>{stat.label}</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{stat.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-2xl font-bold mb-3" style={{ color: 'var(--color-indigo-primary)' }}>
            Wat gebruikers zeggen
          </h2>
          <p className="text-center text-sm mb-10" style={{ color: 'var(--color-text-muted)' }}>
            Van schoolverlaters tot ervaren professionals
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                name: 'Sarah V.',
                role: 'HBO Communicatie afgestudeerd',
                city: 'Utrecht',
                quote: 'Na mijn afstuderen had ik geen idee hoe ik een goede motivatiebrief moest schrijven. Via Opstap had ik binnen twee weken drie uitnodigingen, ik ben nu aan de slag als junior marketeer.',
                jobs: 7,
              },
              {
                name: 'Daan K.',
                role: 'Carrièreswitch van logistiek naar IT',
                city: 'Eindhoven',
                quote: 'De brieven die Opstap schrijft zijn echt op maat. Ze benadrukken precies de transferable skills die ik had. Na 3 sollicitaties had ik mijn eerste uitnodiging bij een software bedrijf.',
                jobs: 3,
                highlight: true,
              },
              {
                name: 'Fatima O.',
                role: 'MBO Zorg, op zoek naar vaste plek',
                city: 'Amsterdam',
                quote: 'Ik werkte in de nachtdienst en had geen tijd om zelf brieven te schrijven. Opstap deed het voor mij. Binnen een maand had ik een vaste baan bij een zorginstelling in de buurt.',
                jobs: 9,
              },
            ].map(t => (
              <div
                key={t.name}
                className="rounded-2xl p-6 flex flex-col"
                style={{
                  background: t.highlight ? 'var(--color-indigo-primary)' : 'var(--color-lavender-card)',
                  boxShadow: t.highlight ? '0 4px 24px rgba(61,58,140,0.18)' : undefined,
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="mb-4 shrink-0" style={{ color: t.highlight ? 'rgba(255,255,255,0.3)' : 'var(--color-indigo-primary)', opacity: t.highlight ? 1 : 0.4 }}>
                  <path d="M11.192 15.757c0-.88-.23-1.618-.69-2.217-.326-.412-.768-.683-1.327-.812-.55-.128-1.07-.137-1.54-.028-.16-.95.1-1.95.78-3a9.08 9.08 0 0 1 1.46-1.606l-1.18-1.22a10.37 10.37 0 0 0-1.74 1.96c-.86 1.308-1.3 2.658-1.3 4.046 0 1.21.35 2.168 1.05 2.875.7.706 1.63 1.06 2.79 1.06 1.01 0 1.84-.317 2.49-.95.65-.634.97-1.432.97-2.394zm8.692 0c0-.88-.23-1.618-.69-2.217-.326-.42-.77-.692-1.327-.812-.55-.128-1.07-.137-1.54-.028-.16-.95.1-1.95.78-3a9.08 9.08 0 0 1 1.46-1.606l-1.18-1.22a10.37 10.37 0 0 0-1.74 1.96c-.86 1.308-1.3 2.658-1.3 4.046 0 1.21.35 2.168 1.05 2.875.7.706 1.63 1.06 2.79 1.06 1.01 0 1.84-.317 2.49-.95.65-.634.97-1.432.97-2.394z" />
                </svg>
                <p className="text-sm leading-relaxed flex-1 mb-5" style={{ color: t.highlight ? 'rgba(255,255,255,0.88)' : 'var(--color-text-muted)' }}>
                  "{t.quote}"
                </p>
                <div>
                  <p className="text-sm font-semibold" style={{ color: t.highlight ? 'white' : 'var(--color-text-primary)' }}>{t.name}</p>
                  <p className="text-xs" style={{ color: t.highlight ? 'rgba(255,255,255,0.55)' : 'var(--color-text-muted)' }}>{t.role} · {t.city}</p>
                  <p className="text-xs mt-1.5 font-medium" style={{ color: t.highlight ? 'rgba(255,255,255,0.5)' : 'var(--color-indigo-primary)', opacity: t.highlight ? 1 : 0.7 }}>
                    Baan gevonden na {t.jobs} sollicitaties
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-6 text-xs flex flex-wrap items-center justify-center gap-x-3 gap-y-1" style={{ color: 'var(--color-text-muted)' }}>
        <span>© {new Date().getFullYear()} Opstap</span>
        <span aria-hidden>&middot;</span>
        <Link href="/privacy" className="underline hover:opacity-70">Privacyvoorwaarden</Link>
        <span aria-hidden>&middot;</span>
        <Link href="/voorwaarden" className="underline hover:opacity-70">Algemene voorwaarden</Link>
        <span aria-hidden>&middot;</span>
        <Link href="/misbruik" className="underline hover:opacity-70">Misbruik melden</Link>
      </footer>
    </PublicShell>
  )
}
