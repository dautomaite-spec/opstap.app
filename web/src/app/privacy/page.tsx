import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacybeleid — Opstap',
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen" style={{ background: 'var(--color-lavender-bg)' }}>
      <nav className="flex items-center justify-between px-6 py-4 max-w-3xl mx-auto">
        <Link href="/" className="font-bold text-xl" style={{ color: 'var(--color-indigo-primary)' }}>Opstap</Link>
      </nav>

      <article className="max-w-3xl mx-auto px-6 py-8 pb-20">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-indigo-primary)' }}>Privacybeleid</h1>
        <p className="text-sm mb-10" style={{ color: 'var(--color-text-muted)' }}>Laatste update: april 2026</p>

        <Section title="1. Wie zijn wij?">
          <p>Opstap is een dienst voor het automatiseren van sollicitaties, ontwikkeld en beheerd in Nederland. Je kunt ons bereiken via <a href="mailto:privacy@opstapapp.nl" className="underline" style={{ color: 'var(--color-indigo-primary)' }}>privacy@opstapapp.nl</a>.</p>
        </Section>

        <Section title="2. Welke gegevens verwerken wij?">
          <p>Wij verwerken uitsluitend gegevens die je zelf aan ons verstrekt:</p>
          <ul className="mt-3 flex flex-col gap-1.5 list-disc list-inside">
            <li><strong>Accountgegevens</strong>: e-mailadres en wachtwoord (versleuteld opgeslagen via Supabase Auth)</li>
            <li><strong>Profielgegevens</strong>: naam, woonplaats, gewenste functie, beschikbaarheid, uren per week, werklocatie</li>
            <li><strong>CV-bestand</strong>: PDF of Word-bestand dat je uploadt (optioneel)</li>
            <li><strong>Sollicitatie-inhoud</strong>: de door de AI gegenereerde motivatiebrieven die je verstuurt</li>
            <li><strong>Gebruiksgegevens</strong>: tijdstip van laatste activiteit (voor automatische verwijdering na 90 dagen inactiviteit)</li>
          </ul>
        </Section>

        <Section title="3. Waarvoor gebruiken wij je gegevens?">
          <Table
            headers={['Doel', 'Grondslag']}
            rows={[
              ['Vacatures zoeken op Nederlandse jobboards', 'Uitvoering overeenkomst (art. 6 lid 1 b)'],
              ['Motivatiebrief genereren via AI', 'Uitvoering overeenkomst (art. 6 lid 1 b)'],
              ['Sollicitatie versturen per e-mail', 'Uitvoering overeenkomst (art. 6 lid 1 b)'],
              ['Uploaden en opslaan van cv-bestand (optioneel)', 'Toestemming (art. 6 lid 1 a) — gegeven vóór upload'],
              ['Herinneringsmail voor cv-vervaldatum', 'Gerechtvaardigd belang (art. 6 lid 1 f)'],
              ['Verwijdering bij inactiviteit', 'Wettelijke verplichting + gerechtvaardigd belang'],
            ]}
          />
        </Section>

        <Section title="4. Hoe lang bewaren wij je gegevens?">
          <ul className="flex flex-col gap-1.5 list-disc list-inside">
            <li><strong>CV-bestand</strong>: je kiest zelf de bewaartermijn bij het uploaden: 7, 30 of 90 dagen. Je ontvangt 7 dagen vóór de vervaldatum een e-mail. Het bestand wordt automatisch verwijderd op de vervaldatum, tenzij je de termijn verlengt.</li>
            <li><strong>Profielgegevens en sollicitaties</strong>: tot je je account verwijdert, of na 90 dagen aaneengesloten inactiviteit. Je ontvangt 30 dagen vóór automatische verwijdering een e-mail ter waarschuwing.</li>
            <li><strong>Accountgegevens</strong>: tot je je account verwijdert.</li>
          </ul>
          <p className="mt-3">Je kunt je cv of je volledige account op elk moment zelf verwijderen via Instellingen. Verwijdering is permanent en onmiddellijk.</p>
        </Section>

        <Section title="5. Delen wij je gegevens met derden?">
          <p className="mb-4">Wij delen je gegevens <strong>niet</strong> met derden voor commerciële doeleinden. Wij maken gebruik van de volgende verwerkers, uitsluitend voor de uitvoering van de dienst:</p>
          <Table
            headers={['Verwerker', 'Doel', 'Locatie']}
            rows={[
              ['Supabase (PostgreSQL + Storage)', 'Database en cv-opslag', 'EU (eu-central-1, Frankfurt)'],
              ['Anthropic Claude API', 'Genereren van motivatiebrieven', 'Verwerking in transit — geen opslag (Anthropic API privacybeleid)'],
              ['SendGrid (Twilio)', 'Versturen van e-mails', 'VS — beschermd via standaardcontractbepalingen (SCC)'],
            ]}
          />
          <p className="mt-4">Database en cv-bestanden worden <strong>uitsluitend in de EU</strong> opgeslagen. Voor e-mailverzending via SendGrid gelden standaardcontractbepalingen (SCC) conform AVG art. 46. De Claude API verwerkt je cv-inhoud tijdelijk voor het genereren van een motivatiebrief — Anthropic slaat deze gegevens niet op en gebruikt ze niet voor modeltraining (zie <a href="https://www.anthropic.com/legal/privacy" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'var(--color-indigo-primary)' }}>Anthropic privacybeleid</a>). Met alle verwerkers hebben wij een verwerkersovereenkomst afgesloten.</p>
        </Section>

        <Section title="6. Beveiliging">
          <ul className="flex flex-col gap-1.5 list-disc list-inside">
            <li>Alle data wordt versleuteld opgeslagen (AES-256 at rest, TLS 1.3 in transit)</li>
            <li>CV-bestanden worden opgeslagen in een private bucket, alleen toegankelijk met jouw JWT</li>
            <li>Row-Level Security (RLS) zorgt ervoor dat je uitsluitend je eigen gegevens kunt inzien</li>
            <li>Wachtwoorden worden gehashed opgeslagen via Supabase Auth (bcrypt)</li>
          </ul>
        </Section>

        <Section title="7. Jouw rechten (AVG)">
          <ul className="flex flex-col gap-1.5 list-disc list-inside">
            <li><strong>Inzage</strong> (art. 15): je kunt je profielgegevens en sollicitaties altijd inzien in de app</li>
            <li><strong>Rectificatie</strong> (art. 16): je kunt je gegevens aanpassen via Profiel bewerken</li>
            <li><strong>Verwijdering</strong> (art. 17): je kunt je cv of je hele account permanent verwijderen via Instellingen</li>
            <li><strong>Beperking</strong> (art. 18): je kunt verzoeken de verwerking van je gegevens tijdelijk te beperken</li>
            <li><strong>Intrekking toestemming</strong> (art. 7 lid 3): je kunt je toestemming voor cv-opslag op elk moment intrekken door je cv te verwijderen via Instellingen</li>
            <li><strong>Bezwaar</strong> (art. 21): je kunt bezwaar maken tegen verwerking op grond van gerechtvaardigd belang</li>
            <li><strong>Dataportabiliteit</strong> (art. 20): stuur een verzoek naar <a href="mailto:privacy@opstapapp.nl" className="underline" style={{ color: 'var(--color-indigo-primary)' }}>privacy@opstapapp.nl</a></li>
            <li><strong>Klacht indienen</strong>: bij de <a href="https://www.autoriteitpersoonsgegevens.nl" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'var(--color-indigo-primary)' }}>Autoriteit Persoonsgegevens</a></li>
          </ul>
          <p className="mt-3">Voor rechten die niet automatisch beschikbaar zijn: <a href="mailto:privacy@opstapapp.nl" className="underline" style={{ color: 'var(--color-indigo-primary)' }}>privacy@opstapapp.nl</a>. Wij reageren binnen 30 dagen.</p>
        </Section>

        <Section title="8. Cookies en tracking">
          <p>Opstap gebruikt <strong>geen</strong> cookies of advertentietrackers. Voor anonieme bezoekersstatistieken gebruiken wij <strong>Plausible Analytics</strong>, een privacyvriendelijke dienst zonder cookies, zonder persoonlijk identificeerbare informatie en zonder tracking over websites heen. Plausible voldoet volledig aan de AVG en slaat geen persoonsgegevens op. Er is geen Google Analytics, Firebase Analytics of vergelijkbare advertentiedienst actief.</p>
        </Section>

        <Section title="9. Geautomatiseerde besluitvorming">
          <p>De AI genereert motivatiebrieven op basis van jouw profiel en de vacaturetekst. Dit is een <strong>ondersteunende</strong> functie: jij ziet de brief altijd vóór hij verstuurd wordt en kunt hem aanpassen of weigeren. Er worden geen juridisch significante beslissingen genomen op basis van uitsluitend geautomatiseerde verwerking.</p>
        </Section>

        <Section title="10. Wijzigingen">
          <p>Als wij dit beleid wijzigen, informeren wij je via e-mail. De datum van de laatste wijziging staat bovenaan dit document.</p>
        </Section>

        <Section title="11. Contact">
          <p><strong>E-mail</strong>: <a href="mailto:privacy@opstapapp.nl" className="underline" style={{ color: 'var(--color-indigo-primary)' }}>privacy@opstapapp.nl</a><br />
          <strong>Opstap</strong> — Nederland</p>
        </Section>
      </article>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--color-indigo-primary)' }}>{title}</h2>
      <div className="text-sm leading-relaxed flex flex-col gap-2" style={{ color: 'var(--color-text-primary)' }}>
        {children}
      </div>
    </section>
  )
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl" style={{ background: 'var(--color-lavender-card)' }}>
      <table className="w-full text-sm">
        <thead>
          <tr>
            {headers.map(h => (
              <th key={h} className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--color-indigo-primary)', borderBottom: '1px solid var(--color-lavender-bg)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3" style={{ color: 'var(--color-text-primary)', borderBottom: i < rows.length - 1 ? '1px solid var(--color-lavender-bg)' : 'none' }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
