import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Welkom bij Opstap',
  description: 'Opstap helpt je automatisch solliciteren op Nederlandse vacatures. Persoonlijke brieven, meerdere jobs tegelijk.',
  robots: { index: false, follow: false },
}

const steps = [
  {
    number: '1',
    title: 'Vertel wie je bent',
    body: 'Upload je CV of vul je profiel in. Opstap onthoudt je ervaring, opleiding en voorkeuren zodat jij dat nooit twee keer hoeft in te vullen.',
  },
  {
    number: '2',
    title: 'Kies vacatures die bij je passen',
    body: 'We zoeken voor jou op Indeed, LinkedIn, Jobbird en meer. Jij bladert door de resultaten en tikt aan wat je aanspreekt.',
  },
  {
    number: '3',
    title: 'Opstap schrijft je motivatiebrief',
    body: 'Voor elke vacature schrijft Opstap een persoonlijke brief in het Nederlands. Je leest hem, past aan wat je wil, en geeft het groene licht.',
  },
  {
    number: '4',
    title: 'Wij versturen, jij wacht op goed nieuws',
    body: 'Opstap stuurt je sollicitatie per e-mail of via het webformulier van het bedrijf. Geen gedoe meer - gewoon wachten op een uitnodiging.',
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

        {/* Hero */}
        <h1 className="text-4xl font-bold leading-tight mb-4" style={{ color: 'var(--color-indigo-primary)' }}>
          Fijn dat je er bent.
        </h1>
        <p className="text-lg mb-4" style={{ color: 'var(--color-text-muted)' }}>
          Solliciteren kost veel tijd en energie. Opstap neemt dat grotendeels van je over - zodat jij je kunt focussen op de banen die er echt toe doen.
        </p>
        <p className="text-lg mb-10" style={{ color: 'var(--color-text-muted)' }}>
          Je bent uitgenodigd om het gratis te proberen. Snel ingericht, en je eerste sollicitaties versturen kost je letterlijk minuten.
        </p>

        {/* How it works */}
        <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>Zo werkt het</h2>
        <div className="flex flex-col gap-3 mb-12">
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
            Maak een account aan en je eerste sollicitatie is onderweg voordat je het weet.
          </p>
          <Link
            href={`/register?invite=${code}`}
            className="inline-block px-8 py-3 rounded-xl font-semibold text-sm"
            style={{ background: 'var(--color-white)', color: 'var(--color-indigo-primary)' }}
          >
            Account aanmaken
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
