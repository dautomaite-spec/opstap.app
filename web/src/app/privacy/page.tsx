import type { Metadata } from 'next'
import Link from 'next/link'
import PublicShell from '@/app/components/PublicShell'

export const metadata: Metadata = {
  title: 'Privacybeleid — Opstap',
  description: 'Hoe Opstap omgaat met je persoonsgegevens, CV en sollicitatie-informatie. AVG-conform, geen trackers.',
}

const SECTIONS = [
  {
    id: 'wie',
    title: '1. Wie zijn wij?',
    content: (
      <p>
        Opstap is een dienst voor het automatiseren van sollicitaties, ontwikkeld en beheerd in Nederland.
        Je kunt ons bereiken via{' '}
        <a href="/contact" className="underline" style={{ color: 'var(--color-indigo-primary)' }}>
          ons contactformulier
        </a>{' '}
        of via <strong>privacy@opstapapp.nl</strong>.
      </p>
    ),
  },
  {
    id: 'gegevens',
    title: '2. Welke gegevens verwerken wij?',
    content: (
      <>
        <p className="mb-3">Wij verwerken uitsluitend gegevens die je zelf aan ons verstrekt:</p>
        <ul className="list-disc pl-5 flex flex-col gap-1.5">
          <li><strong>Accountgegevens</strong>: e-mailadres en wachtwoord (versleuteld opgeslagen via Supabase Auth)</li>
          <li><strong>Profielgegevens</strong>: naam, woonplaats, gewenste functie, beschikbaarheid, uren per week, werklocatie</li>
          <li><strong>CV-bestand</strong>: PDF of Word-bestand dat je uploadt (optioneel)</li>
          <li><strong>Sollicitatie-inhoud</strong>: de door de AI gegenereerde motivatiebrieven die je verstuurt</li>
          <li><strong>Gebruiksgegevens</strong>: tijdstip van laatste activiteit (voor automatische verwijdering na 90 dagen inactiviteit)</li>
        </ul>
      </>
    ),
  },
  {
    id: 'doel',
    title: '3. Waarvoor gebruiken wij je gegevens?',
    content: (
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr style={{ background: 'var(--color-lavender-card)' }}>
              <th className="text-left px-4 py-2.5 font-semibold rounded-tl-lg" style={{ color: 'var(--color-indigo-primary)' }}>Doel</th>
              <th className="text-left px-4 py-2.5 font-semibold rounded-tr-lg" style={{ color: 'var(--color-indigo-primary)' }}>Grondslag</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Vacatures zoeken op Nederlandse jobboards', 'Uitvoering overeenkomst'],
              ['Motivatiebrief genereren via AI', 'Uitvoering overeenkomst'],
              ['Sollicitatie versturen per e-mail', 'Uitvoering overeenkomst'],
              ['Beveiligde opslag van je CV', 'Uitvoering overeenkomst'],
              ['Herinneringsmail voor CV-vervaldatum', 'Gerechtvaardigd belang (AVG art. 6 lid 1 f)'],
              ['Verwijdering bij inactiviteit', 'Wettelijke verplichting + gerechtvaardigd belang'],
            ].map(([doel, grondslag], i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--color-lavender-card)' }}>
                <td className="px-4 py-2.5">{doel}</td>
                <td className="px-4 py-2.5" style={{ color: 'var(--color-text-muted)' }}>{grondslag}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
  },
  {
    id: 'bewaartermijn',
    title: '4. Hoe lang bewaren wij je gegevens?',
    content: (
      <>
        <ul className="list-disc pl-5 flex flex-col gap-2 mb-4">
          <li><strong>CV-bestand</strong>: je kiest zelf de bewaartermijn bij het uploaden: 7, 30 of 90 dagen. Je ontvangt 7 dagen vóór de vervaldatum een e-mail. Het bestand wordt automatisch verwijderd op de vervaldatum, tenzij je de termijn verlengt.</li>
          <li><strong>Profielgegevens en sollicitaties</strong>: tot je je account verwijdert, of na 90 dagen aaneengesloten inactiviteit (automatische verwijdering).</li>
          <li><strong>Accountgegevens</strong>: tot je je account verwijdert.</li>
        </ul>
        <p>Je kunt je CV of je volledige account op elk moment zelf verwijderen via <strong>Instellingen → CV verwijderen</strong> of <strong>Account verwijderen</strong>. Verwijdering is permanent en onmiddellijk.</p>
      </>
    ),
  },
  {
    id: 'derden',
    title: '5. Delen wij je gegevens met derden?',
    content: (
      <>
        <p className="mb-4">Wij delen je gegevens <strong>niet</strong> met derden voor commerciële doeleinden.</p>
        <p className="mb-3">Wij maken gebruik van de volgende verwerkers, uitsluitend voor de uitvoering van de dienst:</p>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ background: 'var(--color-lavender-card)' }}>
                <th className="text-left px-4 py-2.5 font-semibold rounded-tl-lg" style={{ color: 'var(--color-indigo-primary)' }}>Verwerker</th>
                <th className="text-left px-4 py-2.5 font-semibold rounded-tr-lg" style={{ color: 'var(--color-indigo-primary)' }}>Doel</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Supabase (PostgreSQL + Storage)', 'Database en CV-opslag'],
                ['Anthropic Claude API', 'Genereren van motivatiebrieven (tijdelijke verwerking, geen opslag)'],
                ['SendGrid (Twilio)', 'Versturen van e-mails'],
              ].map(([verwerker, doel], i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--color-lavender-card)' }}>
                  <td className="px-4 py-2.5 font-medium">{verwerker}</td>
                  <td className="px-4 py-2.5" style={{ color: 'var(--color-text-muted)' }}>{doel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mb-3">De Claude API van Anthropic verwerkt je CV-inhoud en vacaturetekst tijdelijk om een motivatiebrief te genereren. Anthropic gebruikt deze gegevens <strong>niet</strong> voor het trainen van AI-modellen (Enterprise API-voorwaarden).</p>
        <p>Vragen over de specifieke opslag van je gegevens? Mail naar <strong>privacy@opstapapp.nl</strong>.</p>
      </>
    ),
  },
  {
    id: 'beveiliging',
    title: '6. Beveiliging',
    content: (
      <ul className="list-disc pl-5 flex flex-col gap-1.5">
        <li>Alle data wordt versleuteld opgeslagen (AES-256 at rest, TLS 1.3 in transit)</li>
        <li>CV-bestanden worden opgeslagen in een private Supabase Storage bucket — alleen toegankelijk met jouw JWT</li>
        <li>Row-Level Security (RLS) zorgt ervoor dat je uitsluitend je eigen gegevens kunt inzien</li>
        <li>Wachtwoorden worden gehashed opgeslagen via Supabase Auth (bcrypt)</li>
      </ul>
    ),
  },
  {
    id: 'rechten',
    title: '7. Jouw rechten (AVG)',
    content: (
      <>
        <p className="mb-3">Je hebt de volgende rechten:</p>
        <ul className="list-disc pl-5 flex flex-col gap-2 mb-4">
          <li><strong>Inzage</strong> (art. 15): je kunt je profielgegevens en sollicitaties altijd inzien in de app</li>
          <li><strong>Rectificatie</strong> (art. 16): je kunt je gegevens aanpassen via Profiel bewerken</li>
          <li><strong>Verwijdering</strong> (art. 17): je kunt je CV of je hele account permanent verwijderen via Instellingen</li>
          <li><strong>Bezwaar</strong> (art. 21): je kunt bezwaar maken tegen verwerking op grond van gerechtvaardigd belang</li>
          <li><strong>Dataportabiliteit</strong> (art. 20): stuur een verzoek naar privacy@opstapapp.nl</li>
          <li><strong>Klacht indienen</strong>: je hebt het recht een klacht in te dienen bij de Autoriteit Persoonsgegevens (<a href="https://autoriteitpersoonsgegevens.nl" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'var(--color-indigo-primary)' }}>autoriteitpersoonsgegevens.nl</a>)</li>
        </ul>
        <p>Voor uitoefening van rechten die niet automatisch in de app beschikbaar zijn: <strong>privacy@opstapapp.nl</strong>. Wij reageren binnen 30 dagen.</p>
      </>
    ),
  },
  {
    id: 'cookies',
    title: '8. Cookies en tracking',
    content: (
      <p>Opstap gebruikt <strong>geen</strong> cookies, advertentietrackers of analysediensten van derden. Er is geen Google Analytics, Firebase Analytics of vergelijkbare dienst actief.</p>
    ),
  },
  {
    id: 'ai',
    title: '9. Geautomatiseerde besluitvorming',
    content: (
      <p>De AI genereert motivatiebrieven op basis van jouw profiel en de vacaturetekst. Dit is een <strong>ondersteunende</strong> functie — jij ziet de brief altijd vóór hij verstuurd wordt en kunt hem aanpassen of weigeren. Er worden geen juridisch of anderszins significante beslissingen uitsluitend op basis van geautomatiseerde verwerking genomen.</p>
    ),
  },
  {
    id: 'wijzigingen',
    title: '10. Wijzigingen',
    content: (
      <p>Als wij dit beleid wijzigen, informeren wij je via e-mail en in de app. De datum van de laatste wijziging staat bovenaan dit document.</p>
    ),
  },
  {
    id: 'contact-privacy',
    title: '11. Contact',
    content: (
      <>
        <p className="mb-2">Voor vragen over privacy of het uitoefenen van je rechten:</p>
        <p><strong>E-mail</strong>: privacy@opstapapp.nl</p>
        <p><strong>Opstap</strong> — Nederland</p>
      </>
    ),
  },
]

export default function PrivacyPage() {
  return (
    <PublicShell>
      <div className="max-w-3xl mx-auto px-6 py-16 md:py-24 w-full">

        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-3" style={{ color: 'var(--color-indigo-primary)' }}>
            Privacybeleid
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Laatste update: juni 2026
          </p>
        </div>

        <nav className="rounded-2xl p-5 mb-12" style={{ background: 'var(--color-lavender-card)' }}>
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--color-indigo-primary)' }}>
            Inhoud
          </p>
          <ol className="flex flex-col gap-1.5">
            {SECTIONS.map(s => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-sm hover:underline" style={{ color: 'var(--color-indigo-primary)' }}>
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="flex flex-col gap-10">
          {SECTIONS.map(s => (
            <section key={s.id} id={s.id}>
              <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-indigo-primary)' }}>
                {s.title}
              </h2>
              <div className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                {s.content}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-16 pt-8 flex gap-6 text-sm" style={{ borderTop: '1px solid var(--color-lavender-card)', color: 'var(--color-text-muted)' }}>
          <Link href="/contact" className="hover:underline" style={{ color: 'var(--color-indigo-primary)' }}>Contact</Link>
          <Link href="/faq" className="hover:underline" style={{ color: 'var(--color-indigo-primary)' }}>Help & FAQ</Link>
          <Link href="/" className="hover:underline" style={{ color: 'var(--color-indigo-primary)' }}>Terug naar home</Link>
        </div>

      </div>
    </PublicShell>
  )
}
