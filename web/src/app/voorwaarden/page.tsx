import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Algemene voorwaarden | Opstap',
  description: 'Lees de algemene voorwaarden van Opstap.',
  alternates: { canonical: 'https://opstapapp.nl/voorwaarden' },
}

export default function VoorwaardenPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--color-lavender-bg)' }}>
      <nav className="px-6 py-4 border-b" style={{ background: 'var(--color-white)', borderColor: 'var(--color-lavender-card)' }}>
        <Link href="/" className="font-bold text-lg" style={{ color: 'var(--color-indigo-primary)' }}>
          Opstap
        </Link>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
          Algemene voorwaarden
        </h1>
        <p className="text-sm mb-8" style={{ color: 'var(--color-text-muted)' }}>
          Laatste wijziging: juni 2026
        </p>

        <Section title="1. Over Opstap">
          Opstap is een dienst die werkzoekenden in Nederland helpt bij het vinden van vacatures en het opstellen van sollicitatiebrieven met behulp van kunstmatige intelligentie. Door gebruik te maken van Opstap ga je akkoord met deze voorwaarden.
        </Section>

        <Section title="2. Account">
          Je bent verantwoordelijk voor de beveiliging van je account en wachtwoord. Gebruik Opstap alleen voor legitieme sollicitatiedoeleinden. Misbruik, waaronder het versturen van spam of het solliciteren op vacatures die je niet serieus overweegt, is niet toegestaan en kan leiden tot blokkering van je account.
        </Section>

        <Section title="3. Gebruik van de dienst">
          Opstap mag je gebruiken voor persoonlijk, niet-commercieel gebruik. Het is niet toegestaan de dienst te automatiseren buiten de geboden functionaliteit, de dienst door te verkopen of aan derden ter beschikking te stellen.
        </Section>

        <Section title="4. Gegenereerde sollicitatiebrieven">
          De door AI gegenereerde motivatiebrieven zijn een hulpmiddel. Jij bent zelf verantwoordelijk voor de inhoud van alle sollicitaties die je verstuurt. Opstap is niet aansprakelijk voor de gevolgen van ingediende sollicitaties.
        </Section>

        <Section title="5. Beschikbaarheid">
          We streven naar een hoge beschikbaarheid maar geven geen garanties. We mogen de dienst aanpassen, uitbreiden of beëindigen. Bij beëindiging ontvang je tijdig bericht en de mogelijkheid je gegevens te exporteren.
        </Section>

        <Section title="6. Persoonsgegevens">
          Hoe we omgaan met je persoonsgegevens staat beschreven in ons{' '}
          <Link href="/privacy" className="underline" style={{ color: 'var(--color-indigo-primary)' }}>
            privacyvoorwaarden
          </Link>
          , dat onderdeel uitmaakt van deze voorwaarden.
        </Section>

        <Section title="7. Aansprakelijkheid">
          Opstap is niet aansprakelijk voor indirecte schade of gevolgschade die voortvloeit uit het gebruik van de dienst. Onze aansprakelijkheid is in alle gevallen beperkt tot het bedrag dat je in de afgelopen drie maanden voor de dienst hebt betaald.
        </Section>

        <Section title="8. Wijzigingen">
          We kunnen deze voorwaarden van tijd tot tijd aanpassen. Wezenlijke wijzigingen kondigen we aan via e-mail of een melding in de app, minimaal 14 dagen van tevoren.
        </Section>

        <Section title="9. Toepasselijk recht">
          Op deze voorwaarden is Nederlands recht van toepassing. Geschillen worden voorgelegd aan de bevoegde rechter in Nederland.
        </Section>

        <Section title="10. Contact">
          Vragen over deze voorwaarden? Stuur een e-mail naar{' '}
          <a href="mailto:info@opstapapp.nl" className="underline" style={{ color: 'var(--color-indigo-primary)' }}>
            info@opstapapp.nl
          </a>
          .
        </Section>
      </main>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-base font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
        {title}
      </h2>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
        {children}
      </p>
    </section>
  )
}
