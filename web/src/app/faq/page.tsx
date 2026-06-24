import Link from 'next/link'
import type { Metadata } from 'next'
import FaqAccordion from './FaqAccordion'
import PublicShell from '@/app/components/PublicShell'

export const metadata: Metadata = {
  title: 'Help & FAQ | Opstap',
  description: 'Veelgestelde vragen over Opstap: hoe werkt het, wat kost het en hoe beschermen we je gegevens?',
}

const SECTIONS = [
  {
    title: 'Aan de slag',
    items: [
      {
        q: 'Wat is Opstap?',
        a: 'Opstap is een tool die automatisch voor jou solliciteert. Je uploadt je CV of vult je profiel in, kiest vacatures op de grootste Nederlandse jobboards en Opstap schrijft een persoonlijke motivatiebrief per vacature. Jij keurt goed, wij versturen.',
      },
      {
        q: 'Hoe maak ik een account aan?',
        a: 'Ga naar opstapapp.nl, klik op "Aan de slag" en registreer je met e-mail of via Google, Outlook of Meta. Je kunt direct beginnen zodra je account is aangemaakt.',
      },
      {
        q: 'Moet ik een CV uploaden?',
        a: 'Nee, dat is optioneel. Je kunt je profiel ook handmatig invullen. Als je een CV uploadt, slaan we het versleuteld op en gebruiken we de informatie om betere brieven te schrijven.',
      },
    ],
  },
  {
    title: 'Motivatiebrieven',
    items: [
      {
        q: 'Zijn de brieven echt gepersonaliseerd?',
        a: 'Ja. Elke brief wordt gegenereerd op basis van de specifieke vacature én jouw profiel. Opstap is gebouwd vanuit recruiterervaring: de AI weet welke toon, lengte en inhoud bij welk type bedrijf past, en wat hiring managers wél en niet willen lezen.',
      },
      {
        q: 'Wat maakt Opstap beter dan ChatGPT?',
        a: 'ChatGPT schrijft een correcte tekst, maar herkent een hiring manager meteen als AI-output. Opstap-brieven zijn opgebouwd vanuit jarenlange recruitmentervaring: concrete koppeling tussen jouw achtergrond en de vacature, geen generieke openers, en afgestemd op het bedrijfstype. Altijd bewerkbaar voordat je verstuurt.',
      },
      {
        q: 'Kan ik een brief aanpassen voordat hij verstuurd wordt?',
        a: 'Altijd. Je keurt elke brief goed en kunt hem volledig bewerken voordat er iets verstuurd wordt. Niets gaat zonder jouw goedkeuring de deur uit.',
      },
      {
        q: 'In welke taal worden de brieven geschreven?',
        a: 'Standaard in het Nederlands. Opstap is gericht op de Nederlandse arbeidsmarkt.',
      },
    ],
  },
  {
    title: 'Privacy & gegevens',
    items: [
      {
        q: 'Wat gebeurt er met mijn CV en persoonsgegevens?',
        a: 'Je gegevens worden versleuteld opgeslagen op EU-servers. We delen niets met derden en gebruiken jouw data niet voor AI-training. Je bepaalt zelf hoe lang we je CV bewaren (standaard 30 dagen). Je kunt alles op elk moment verwijderen.',
      },
      {
        q: 'Voldoet Opstap aan de AVG?',
        a: 'Ja. We vragen expliciete toestemming voordat je een CV uploadt, slaan alle data op binnen de EU en bieden je het recht op inzage en verwijdering. Elke geautomatiseerde beslissing (zoals de brief die AI schrijft) is altijd zichtbaar en bewerkbaar voor jou.',
      },
      {
        q: 'Hoe verwijder ik mijn account en gegevens?',
        a: 'Ga naar Instellingen → Account verwijderen. Alle gegevens worden direct en permanent verwijderd, inclusief je CV en sollicitatiegeschiedenis.',
      },
    ],
  },
  {
    title: 'Kosten',
    items: [
      {
        q: 'Is Opstap gratis?',
        a: 'Je begint gratis. Bij aanmelding krijg je direct een aantal gratis credits, genoeg om te ervaren hoe het werkt. Zodra je credits op zijn, laten we je precies zien wat het kost om door te gaan. Geen verrassing vooraf, geen abonnement.',
      },
      {
        q: 'Hoe werkt het creditssysteem?',
        a: '1 credit = 1 motivatiebrief. Je gebruikt credits alleen wanneer je een brief laat genereren. Als je credits op zijn, zie je de opties om bij te kopen. Credits verlopen nooit.',
      },
      {
        q: 'Zijn er abonnementskosten?',
        a: 'Nee. Je betaalt alleen voor wat je gebruikt, wanneer je het nodig hebt. Geen maandelijkse kosten, geen verborgen kosten. Je kunt bijkopen via iDEAL.',
      },
    ],
  },
]

export default function FaqPage() {
  return (
    <PublicShell>
      <div className="max-w-2xl mx-auto px-6 py-16 md:py-24">

        <h1 className="text-4xl font-bold mb-3" style={{ color: 'var(--color-indigo-primary)' }}>
          Help & FAQ
        </h1>
        <p className="text-base mb-12" style={{ color: 'var(--color-text-muted)' }}>
          Staat je vraag er niet bij?{' '}
          <a href="/contact" className="underline" style={{ color: 'var(--color-indigo-primary)' }}>
            Stuur ons een bericht
          </a>
          .
        </p>

        <div className="flex flex-col gap-12">
          {SECTIONS.map(section => (
            <section key={section.title}>
              <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-indigo-primary)' }}>
                {section.title}
              </h2>
              <FaqAccordion items={section.items} />
            </section>
          ))}
        </div>

      </div>
    </PublicShell>
  )
}
