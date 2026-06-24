import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Welkom bij Opstap: automatisch solliciteren',
  description: 'Opstap zoekt vacatures voor jou, schrijft je motivatiebrief en solliciteert automatisch. Probeer het gratis.',
  robots: { index: false, follow: false },
}

const steps = [
  {
    number: '1',
    title: 'Upload je CV of vul je profiel in',
    body: 'Opstap haalt je werkervaring, opleiding en vaardigheden op. Je hoeft nooit meer hetzelfde formulier twee keer in te vullen.',
  },
  {
    number: '2',
    title: 'Zoek vacatures op Nederlandse jobboards',
    body: 'We doorzoeken Indeed, LinkedIn, Jobbird en Nationale Vacaturebank tegelijk. Kies de vacatures die je aanspreken.',
  },
  {
    number: '3',
    title: 'Opstap schrijft je motivatiebrief',
    body: 'Voor elke vacature schrijft onze AI een persoonlijke brief in het Nederlands. Jij leest hem, past aan indien gewenst, en keurt goed.',
  },
  {
    number: '4',
    title: 'Wij versturen, jij wacht op een reactie',
    body: 'Opstap stuurt je sollicitatie per e-mail of via het webformulier van het bedrijf. Je hoeft er niets meer aan te doen.',
  },
]

export default async function InvitePage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params

  return (
    <main className="min-h-screen" style={{ background: 'var(--color-lavender-bg)' }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-3xl mx-auto">
        <span className="font-bold text-xl" style={{ color: 'var(--color-indigo-primary)' }}>Opstap</span>
        <Link
          href={`/register?invite=${code}`}
          className="px-5 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'var(--color-indigo-primary)' }}
        >
          Begin nu
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-12">

        {/* Invite badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-8"
          style={{ background: 'var(--color-lavender-card)', color: 'var(--color-indigo-primary)' }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-indigo-primary)', display: 'inline-block' }} />
          Je bent uitgenodigd - toegang direct beschikbaar
        </div>

        {/* Hero */}
        <h1 className="text-4xl font-bold leading-tight mb-4" style={{ color: 'var(--color-indigo-primary)' }}>
          Meer kansen.<br />Minder moeite.
        </h1>
        <p className="text-lg mb-10" style={{ color: 'var(--color-text-muted)' }}>
          Opstap is een Nederlandse sollicitatietool die vacatures zoekt, motivatiebrieven schrijft en voor jou solliciteert op meerdere functies tegelijk.
        </p>

        {/* Why */}
        <div
          className="rounded-2xl p-6 mb-10"
          style={{ background: 'var(--color-white)', boxShadow: '0 2px 16px rgba(61,58,140,0.06)' }}
        >
          <h2 className="text-base font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            Waarom Opstap?
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
            Gemiddeld kost één sollicitatie 45 minuten. Opstap brengt dat terug naar minder dan 2 minuten per vacature. Je houdt volledige controle: elke brief is leesbaar en aanpasbaar voordat hij verstuurd wordt. Geen verrassingen, geen spam. Gewoon meer kansen in minder tijd.
          </p>
        </div>

        {/* How it works */}
        <h2 className="text-lg font-bold mb-6" style={{ color: 'var(--color-text-primary)' }}>Zo werkt het</h2>
        <div className="flex flex-col gap-4 mb-12">
          {steps.map(step => (
            <div
              key={step.number}
              className="flex gap-4 rounded-2xl p-5"
              style={{ background: 'var(--color-white)', boxShadow: '0 2px 12px rgba(61,58,140,0.05)' }}
            >
              <div
                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                style={{ background: 'var(--color-indigo-primary)' }}
              >
                {step.number}
              </div>
              <div>
                <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>{step.title}</p>
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{step.body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div
          className="rounded-2xl p-8 text-center"
          style={{ background: 'var(--color-indigo-primary)' }}
        >
          <h2 className="text-xl font-bold text-white mb-2">Klaar om te beginnen?</h2>
          <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.75)' }}>
            Maak gratis een account aan. Je krijgt direct credits om je eerste sollicitaties te versturen.
          </p>
          <Link
            href={`/register?invite=${code}`}
            className="inline-block px-8 py-3 rounded-xl font-semibold text-sm"
            style={{ background: 'var(--color-white)', color: 'var(--color-indigo-primary)' }}
          >
            Account aanmaken →
          </Link>
          <p className="text-xs mt-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Je gegevens blijven op EU-servers en worden nooit gedeeld.
          </p>
        </div>

        {/* Footer links */}
        <div className="flex gap-6 justify-center mt-10 text-xs" style={{ color: 'var(--color-text-muted)' }}>
          <Link href="/privacy" className="hover:underline">Privacyvoorwaarden</Link>
          <Link href="/voorwaarden" className="hover:underline">Gebruiksvoorwaarden</Link>
          <Link href="/faq" className="hover:underline">Veelgestelde vragen</Link>
        </div>
      </div>
    </main>
  )
}
