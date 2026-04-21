# Privacybeleid Opstap

*Laatste update: april 2026*

---

## 1. Wie zijn wij?

Opstap is een dienst voor het automatiseren van sollicitaties, ontwikkeld en beheerd in Nederland. Je kunt ons bereiken via privacy@opstap.nl.

---

## 2. Welke gegevens verwerken wij?

Wij verwerken uitsluitend gegevens die je zelf aan ons verstrekt:

- **Accountgegevens**: e-mailadres en wachtwoord (versleuteld opgeslagen via Supabase Auth)
- **Profielgegevens**: naam, woonplaats, gewenste functie, beschikbaarheid, uren per week, werklocatie
- **CV-bestand**: PDF of Word-bestand dat je uploadt (optioneel)
- **Sollicitatie-inhoud**: de door de AI gegenereerde motivatiebrieven die je verstuurt
- **Gebruiksgegevens**: tijdstip van laatste activiteit (voor automatische verwijdering na 90 dagen inactiviteit)

---

## 3. Waarvoor gebruiken wij je gegevens?

| Doel | Grondslag |
|---|---|
| Vacatures zoeken op Nederlandse jobboards | Uitvoering overeenkomst |
| Motivatiebrief genereren via AI | Uitvoering overeenkomst |
| Sollicitatie versturen per e-mail | Uitvoering overeenkomst |
| Beveiligde opslag van je cv | Uitvoering overeenkomst |
| Herinneringsmail voor cv-vervaldatum | Gerechtvaardigd belang (AVG art. 6 lid 1 f) |
| Verwijdering bij inactiviteit | Wettelijke verplichting + gerechtvaardigd belang |

---

## 4. Hoe lang bewaren wij je gegevens?

- **CV-bestand**: je kiest zelf de bewaartermijn bij het uploaden: 7, 30 of 90 dagen. Je ontvangt 7 dagen vóór de vervaldatum een e-mail. Het bestand wordt automatisch verwijderd op de vervaldatum, tenzij je de termijn verlengt.
- **Profielgegevens en sollicitaties**: tot je je account verwijdert, of na 90 dagen aaneengesloten inactiviteit (automatische verwijdering).
- **Accountgegevens**: tot je je account verwijdert.

Je kunt je cv of je volledige account op elk moment zelf verwijderen via Instellingen → CV verwijderen of Account verwijderen. Verwijdering is permanent en onmiddellijk.

---

## 5. Delen wij je gegevens met derden?

Wij delen je gegevens **niet** met derden voor commerciële doeleinden.

Wij maken gebruik van de volgende verwerkers, uitsluitend voor de uitvoering van de dienst:

| Verwerker | Doel | Locatie |
|---|---|---|
| Supabase (PostgreSQL + Storage) | Database en cv-opslag | EU (eu-central-1, Frankfurt) |
| Anthropic Claude API | Genereren van motivatiebrieven | Verwerking in transit, geen opslag |
| SendGrid (Twilio) | Versturen van e-mails | EU-servers beschikbaar, e-mail in transit |

Met alle verwerkers hebben wij een verwerkersovereenkomst afgesloten. Je gegevens worden **nooit buiten de EU** opgeslagen.

De Claude API van Anthropic verwerkt je cv-inhoud en vacaturetekst tijdelijk om een motivatiebrief te genereren. Anthropic gebruikt deze gegevens **niet** voor het trainen van AI-modellen (Enterprise API terms).

---

## 6. Beveiliging

- Alle data wordt versleuteld opgeslagen (AES-256 at rest, TLS 1.3 in transit)
- CV-bestanden worden opgeslagen in een private Supabase Storage bucket — alleen toegankelijk met jouw JWT
- Row-Level Security (RLS) zorgt ervoor dat je uitsluitend je eigen gegevens kunt inzien
- Wachtwoorden worden gehashed opgeslagen via Supabase Auth (bcrypt)

---

## 7. Jouw rechten (AVG)

Je hebt de volgende rechten:

- **Inzage** (art. 15): je kunt je profielgegevens en sollicitaties altijd inzien in de app
- **Rectificatie** (art. 16): je kunt je gegevens aanpassen via Profiel bewerken
- **Verwijdering** (art. 17): je kunt je cv of je hele account permanent verwijderen via Instellingen
- **Bezwaar** (art. 21): je kunt bezwaar maken tegen verwerking op grond van gerechtvaardigd belang
- **Dataportabiliteit** (art. 20): stuur een verzoek naar privacy@opstap.nl
- **Klacht indienen**: je hebt het recht een klacht in te dienen bij de Autoriteit Persoonsgegevens (autoriteitpersoonsgegevens.nl)

Voor uitoefening van rechten die niet automatisch in de app beschikbaar zijn: privacy@opstap.nl. Wij reageren binnen 30 dagen.

---

## 8. Cookies en tracking

Opstap gebruikt **geen** cookies, advertentietrackers of analysediensten van derden. Er is geen Google Analytics, Firebase Analytics of vergelijkbare dienst actief.

---

## 9. Geautomatiseerde besluitvorming

De AI genereert motivatiebrieven op basis van jouw profiel en de vacaturetekst. Dit is een **ondersteunende** functie — jij ziet de brief altijd vóór hij verstuurd wordt en kunt hem aanpassen of weigeren. Er worden geen juridisch of anderszins significant beslissingen uitsluitend gebaseerd op geautomatiseerde verwerking genomen.

---

## 10. Wijzigingen

Als wij dit beleid wijzigen, informeren wij je via e-mail en in de app. De datum van de laatste wijziging staat bovenaan dit document.

---

## 11. Contact

Voor vragen over privacy of het uitoefenen van je rechten:

**E-mail**: privacy@opstap.nl  
**Opstap** — Nederland
