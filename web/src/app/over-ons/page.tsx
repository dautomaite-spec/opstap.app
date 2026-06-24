import Link from 'next/link'
import type { Metadata } from 'next'
import PublicShell from '@/app/components/PublicShell'

export const metadata: Metadata = {
  title: 'Over Opstap | Meer kansen. Minder moeite.',
  description: 'Opstap is gebouwd door een ervaren recruiter die weet wat hiring managers echt zoeken. Lees ons verhaal.',
}

export default function OverOnsPage() {
  return (
    <PublicShell>
      <div className="max-w-2xl mx-auto px-6 py-16 md:py-24">

        <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--color-indigo-primary)' }}>
          Over Opstap
        </h1>
        <p className="text-lg mb-12" style={{ color: 'var(--color-text-muted)' }}>
          Meer kansen. Minder moeite.
        </p>

        <div className="flex flex-col gap-10 text-base leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-indigo-primary)' }}>Hoe het begon</h2>
            <p>
              Opstap is ontstaan vanuit frustratie, de gezonde soort. Wij zagen elke dag hoe goed gekwalificeerde kandidaten de boot misten. Niet omdat ze niet goed genoeg waren, maar omdat ze zichzelf niet goed genoeg presenteerden. Een motivatiebrief die te generiek was. Een sollicitatie die net iets te laat binnenkwam. Een vacature die ze nooit hadden gezien.
            </p>
            <p className="mt-4">
              Tegelijkertijd zagen wij hoe tijdrovend solliciteren is. Elke vacature vraagt om een aparte brief, aangepast aan de functie, het bedrijf en de hiring manager. Dat is tientallen uren werk voor elke serieuze zoektocht.
            </p>
            <p className="mt-4">
              Opstap lost dat op.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-indigo-primary)' }}>Wat Opstap anders maakt</h2>
            <p>
              Er zijn genoeg tools die AI gebruiken om motivatiebrieven te schrijven. Het probleem: ze produceren generieke teksten die hiring managers in één oogopslag herkennen als AI-output. Ze klinken correct, maar ze overtuigen niet.
            </p>
            <p className="mt-4">
              Bij Opstap is de AI opgebouwd vanuit jarenlange recruitmentervaring. Wij weten wat hiring managers zoeken, wat ze meteen weglegt en wat ze door blijven lezen. Die inzichten zitten ingebakken in elke brief die Opstap schrijft.
            </p>
            <ul className="mt-4 flex flex-col gap-2">
              {[
                'Geen openingszin die begint met "Hierbij solliciteer ik"',
                'Concrete koppeling tussen jouw ervaring en de vacature',
                'Toon en lengte afgestemd op het type bedrijf',
                'Altijd bewerkbaar voordat je verstuurt',
              ].map(item => (
                <li key={item} className="flex items-start gap-2.5">
                  <svg className="mt-0.5 shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-indigo-primary)' }}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-indigo-primary)' }}>Gebouwd voor de Nederlandse arbeidsmarkt</h2>
            <p>
              Opstap zoekt op de grootste Nederlandse jobboards: Indeed, LinkedIn, Jobbird en Nationale Vacaturebank. Alle brieven zijn in het Nederlands, afgestemd op de Nederlandse recruiter en de Nederlandse arbeidsmarkt.
            </p>
          </section>

          <div
            className="rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-4"
            style={{ background: 'var(--color-lavender-card)' }}
          >
            <div className="flex-1">
              <p className="font-semibold text-base" style={{ color: 'var(--color-indigo-primary)' }}>Klaar om te beginnen?</p>
              <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
                Maak een account aan en solliciteer vandaag nog op meerdere vacatures.
              </p>
            </div>
            <Link
              href="/register"
              className="shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90"
              style={{ background: 'var(--color-indigo-primary)' }}
            >
              Aan de slag
            </Link>
          </div>

        </div>

        {/* Legal footer */}
        <div className="mt-16 pt-8" style={{ borderTop: '1px solid var(--color-lavender-card)' }}>
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--color-text-muted)' }}>Juridisch</p>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)', opacity: 0.75 }}>
            Opstap verwerkt persoonsgegevens conform de Algemene Verordening Gegevensbescherming (AVG). Alle data wordt opgeslagen op EU-servers. Je hebt te allen tijde recht op inzage, correctie en verwijdering van je gegevens. Je kunt je account en alle bijbehorende data permanent verwijderen via Instellingen.{' '}
            Opstap deelt geen persoonsgegevens met derden voor commerciële doeleinden en gebruikt jouw data niet voor het trainen van AI-modellen.{' '}
            Meer informatie: <Link href="/privacy" className="underline hover:opacity-80" style={{ color: 'var(--color-text-muted)' }}>privacybeleid</Link>.
          </p>
        </div>

      </div>
    </PublicShell>
  )
}
