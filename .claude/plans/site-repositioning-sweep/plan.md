# Site repositioning sweep: paste-a-link everywhere
Status: planned

## Why (1-3 sentences, tied to the strategy)
The strategy memo (2026-07-12) repositions Opstap as "Plak een vacaturelink, wij doen de rest" — the user brings the job, Opstap writes the letter, sends the application, and preps the interview. PR #148 only updated the two heroes; the rest of the site still sells the old "find jobs and apply" promise, which contradicts the hero and undersells the new interview-prep feature (PR #149). Consistent positioning directly serves the reply/interview metric: visitors must understand the one action we want (paste a link).

## Scope — in
- All copy changes in `web/messages/nl.json` listed below, then translated equivalents in `en.json`, `pl.json`, `ro.json`, `tr.json`, `uk.json` (translate from the new Dutch; keep placeholder tokens like `{functietitel}` intact).
- Two new i18n keys (FAQ interview-prep Q&A) added to all 6 locales and rendered in the FAQ page.
- Hardcoded SEO metadata in `web/src/app/layout.tsx`, `web/src/app/page.tsx`, `web/src/app/opengraph-image.tsx`.
- Nothing else. This is copy only — no component restructuring, no feature changes.

## Scope — out (explicitly)
- The three testimonial quotes, names, roles, cities (`HomePage.testimonial1*` … `testimonial3*`, `jobsFoundAfter`) — untouched.
- The slogan "Meer kansen. Minder moeite." (`PublicShell.slogan`, `heroTitle`, `heroTagline`, `OverOnsPage.pageTitle`, opengraph title/alt) — untouched.
- Both heroes already updated in PR #148: `HomePage.heroTitle`, `heroSubtitle`, `step2Title`, `step2Desc`, `DashboardClient.pasteLinkTitle`, `pasteLinkSubtitle` — untouched.
- Strings where the button/flow genuinely triggers the AI search — keep accurate, do NOT reframe: `DashboardClient.searchButton`, `searchAgainButton`, `searchingTitle`, `noJobsFound`, `searchQueryDisplay`, `noProfilePrompt`, `summaryCardTitle`, `summaryMissingHint`, `fieldLabelJobTitlesHint`, all `ProfielPage` zoekprofiel strings (`jobPreferencesLabel`, `searchProfileSection*`, `summaryHint`, `summaryGenerateButton`, `summaryErrorFallback`, `functietitelsDescription`, `consentModalBody`, `consentBullet3`), `WelkomPage.jobTitleLabel`, `jobTitleHint`, `aboutLabel`, `aboutPlaceholder`. The AI search stays working and findable.
- Blog articles under `web/src/app/blog/` (separate SEO content, separate sweep if ever).
- Backend, Flutter app, store listings, PrivacyPage beyond the one table row below.
- Any layout/design changes.

## Implementation steps (ordered; per step: files to touch, what changes)

All Dutch copy below is final — builder copies it verbatim. Informal je/jij, no em dashes, never "geen creditcard nodig".

### Step 1 — HomePage namespace in `web/messages/nl.json` (rendered by `web/src/app/page.tsx`)

| Key | New Dutch copy |
|---|---|
| `heroBadge` | `Plak een vacaturelink, wij doen de rest` |
| `readyWithJobTitle` | `Een nieuwe {functietitel}-vacature op het oog? Plak de link.` |
| `featureMultipleVacancies` | `Werkt met elke vacature: Indeed, LinkedIn of bedrijfssite` |
| `featurePersonalLetter` | unchanged (`Persoonlijke brief per sollicitatie`) |
| `featureSendMethods` | unchanged (`Versturen per e-mail of webformulier`) |
| `step1Desc` | `Upload je CV of vul je profiel in. Eén keer invullen is genoeg, daarna gebruikt Opstap het voor elke brief.` (`step1Title` unchanged) |
| `step3Title` | `Wij versturen, jij scoort het gesprek` |
| `step3Desc` | `Jij keurt de brief goed, Opstap verstuurt je sollicitatie. Word je uitgenodigd? Dan krijg je van ons een gespreksvoorbereiding op maat.` |
| `recruiterBannerDesc` | unchanged (letter-focused, "wat hiring managers zoeken" is about hiring managers, not job search) |
| `stat1Label` | `Plak een link, wij doen de rest` |
| `stat1Sub` | `Brief, verzending en gespreksvoorbereiding` |
| `stat4Sub` | `Werkt met links van Indeed, LinkedIn, Jobbird en elke bedrijfssite` (`stat4Label` unchanged) |
| `ctaLoggedInSubtitle` | `Plak een vacaturelink, keur je brief goed en verstuur je sollicitatie in een paar klikken.` |
| `ctaLoggedOutSubtitle` | `Maak een account aan, plak je eerste vacaturelink en verstuur je sollicitatie binnen enkele minuten.` |

`stat2*`, `stat3*`, `testimonialsSectionTitle`, `testimonialsSectionSubtitle`, `ctaLoggedInTitle`, `ctaLoggedOutTitle`, buttons: unchanged.

### Step 2 — Nav labels (rendered by `web/src/app/components/PublicShell.tsx` line ~56 and `web/src/app/dashboard/components/DashboardShell.tsx` line ~118; both link to `/dashboard`, which now leads with the paste-link card and has AI search below it)

| Key | New Dutch copy |
|---|---|
| `PublicShell.navVindVacatures` | `Solliciteren` |
| `DashboardShell.navVindVacatures` | `Solliciteren` |

Keep the key name `navVindVacatures` (renaming keys across 6 locales + 2 components adds churn for zero user value). Do not touch `navOpgeslagenVacatures`.

### Step 3 — FAQ (`FaqPage` namespace, rendered by `web/src/app/faq/page.tsx`)

| Key | New Dutch copy |
|---|---|
| `section1A1` | `Opstap solliciteert voor je. Zie je een vacature op Indeed, LinkedIn of een bedrijfssite? Plak de link en Opstap schrijft een persoonlijke motivatiebrief en verstuurt je sollicitatie. Geen vacature op het oog? Dan kan de AI-zoekfunctie er een paar voor je vinden. Jij keurt alles goed voordat er iets de deur uit gaat.` |
| `section2Q5` (NEW) | `Helpt Opstap ook bij het sollicitatiegesprek?` |
| `section2A5` (NEW) | `Ja. Word je uitgenodigd voor een gesprek? Markeer de sollicitatie als "Uitgenodigd voor gesprek" en Opstap maakt een gespreksvoorbereiding op maat: wat het bedrijf doet, welke vragen je kunt verwachten en hoe jouw ervaring aansluit op de vacature.` |

Builder must add the new Q&A pair to `web/src/app/faq/page.tsx` in section 2 (after the existing `section2Q4`/`section2A4` render), following the existing render pattern in that file. Scan of the remaining FAQ keys found no other search-first framing (`section1A2`, `section1A3`, sections 2-4 are letter/privacy/credits focused) — leave them.

### Step 4 — over-ons (`OverOnsPage` namespace, rendered by `web/src/app/over-ons/page.tsx`)

| Key | New Dutch copy |
|---|---|
| `section1Para1` | `Opstap is ontstaan vanuit frustratie, de gezonde soort. Wij zagen elke dag hoe goed gekwalificeerde kandidaten de boot misten. Niet omdat ze niet goed genoeg waren, maar omdat ze zichzelf niet goed genoeg presenteerden. Een motivatiebrief die te generiek was. Een sollicitatie die net iets te laat binnenkwam. Een gesprek waar ze onvoorbereid naartoe gingen.` |
| `section3Para1` | `Opstap werkt met elke Nederlandse vacature: plak een link van Indeed, LinkedIn, Jobbird, Nationale Vacaturebank of een bedrijfssite. Alle brieven zijn in het Nederlands, afgestemd op de Nederlandse recruiter en de Nederlandse arbeidsmarkt.` |
| `ctaSubtext` | `Maak een account aan, plak een vacaturelink en verstuur vandaag nog je eerste sollicitatie.` |

`pageDescription`, `section1Para2`, `section2*`, `featureItem*`, `legalText`: unchanged (letter-focused or legal, no search-first framing).

### Step 5 — Dashboard/onboarding CTAs (search-flavored but target action is applying)

| Key (renders in) | New Dutch copy |
|---|---|
| `WelkomPage.step3Instruction` (`web/src/app/dashboard/welkom/page.tsx` ~line 269) | `Plak een vacaturelink en laat Opstap je brief schrijven. Geen vacature bij de hand? De AI kan er ook een paar voor je zoeken.` |
| `WelkomPage.searchJobsButton` (same file, button navigates to `/dashboard`) | `Start met solliciteren →` |
| `WelkomPage.step1Description` | `Vertel ons iets over jezelf. We gebruiken dit om jouw brieven persoonlijk en overtuigend te maken.` |
| `SollicitiesPage.emptyStateCta` (`web/src/app/dashboard/sollicitaties/page.tsx` ~line 135, links to `/dashboard`) | `Solliciteer op een vacature` |
| `Achievements.achievementApplyCta` (`web/src/app/dashboard/components/Achievements.tsx` ~line 57, href `/dashboard`) | `Plak een vacaturelink` |
| `InvitePage.step2Body` (`web/src/app/invite/[code]/page.tsx`) | `Zag je een vacature op Indeed, LinkedIn of een bedrijfssite? Plak de link. Liever laten zoeken? Dat kan ook, de AI vindt vacatures die bij je passen.` |
| `DashboardClient.profileFormSubtitle` (`web/src/app/dashboard/DashboardClient.tsx`) | `Vul je gegevens in zodat we overtuigende brieven voor je kunnen schrijven.` |

Builder must confirm each button's destination before changing its label; if a button turns out to trigger the AI search directly (not navigate to the dashboard), leave its label search-accurate and note it in the build report.

### Step 6 — Legal-adjacent accuracy fixes (must stay factually correct, AI search still exists)

| Key | New Dutch copy |
|---|---|
| `PrivacyPage.tableRow1Doel` | `Motivatiebrieven schrijven, sollicitaties versturen en, als je de AI-zoekfunctie gebruikt, passende vacatures vinden` |
| `VoorwaardenPage.section1Body` | `Opstap is een dienst die werkzoekenden in Nederland helpt bij het solliciteren: het schrijven van motivatiebrieven met behulp van kunstmatige intelligentie, het versturen van sollicitaties en het voorbereiden op sollicitatiegesprekken. Optioneel kan Opstap ook vacatures voor je zoeken. Door gebruik te maken van Opstap ga je akkoord met deze voorwaarden.` |

Builder must check the row context in `web/src/app/privacy/page.tsx` (tableRow1 also has grondslag/bewaartermijn cells) and keep the Doel cell consistent with them.

### Step 7 — Hardcoded SEO metadata

- `web/src/app/layout.tsx` lines ~14-28 (three occurrences: `metadata`, `openGraph`, `twitter`). Title stays `Opstap: Meer kansen. Minder moeite.` New description (all three): `Plak een vacaturelink en Opstap schrijft je motivatiebrief, verstuurt je sollicitatie en bereidt je voor op het gesprek. Voor de Nederlandse arbeidsmarkt.`
- `web/src/app/page.tsx` line ~18: same new description.
- `web/src/app/opengraph-image.tsx` line ~57: replace `Automatisch solliciteren op Nederlandse vacatures met AI-motivatiebrieven.` with `Plak een vacaturelink, wij doen de rest.` Line 4 `alt` and the "Meer kansen." headline stay.
- Check `web/src/app/register/page.tsx` and `web/src/app/over-ons/page.tsx` metadata (they pull from i18n keys `RegisterPage.pageTitle/pageDescription`, `OverOnsPage.pageTitle/pageDescription`) — grep those key values for search-first framing; OverOns pageDescription is already fine, verify RegisterPage's is too and only change if it promises job search.

### Step 8 — Translate to the other 5 locales
For every key changed or added in steps 1-6, update `en.json`, `pl.json`, `ro.json`, `tr.json`, `uk.json` with translations of the new Dutch. Preserve placeholders (`{functietitel}`, `{naam}`, `{count}`) exactly. Add `FaqPage.section2Q5`/`section2A5` to all 6 files.

### Step 9 — Verify
- `python -c "import json;[json.load(open(f'web/messages/{l}.json',encoding='utf-8')) for l in ['nl','en','pl','ro','tr','uk']]"` — all parse.
- Key-parity script (write to scratchpad, not repo): for each locale, assert set of `namespace.key` pairs equals nl.json's; print diffs.
- `cd web && npx tsc --noEmit && npm run build`.

## Data changes (migrations, applied how)
None. No DB, no Supabase, no backend.

## Risks & security/AVG notes (what could leak, break, or need consent)
- **AVG accuracy (schedule `/avg-checker`)**: Step 6 touches the privacy policy processing-purposes table and the terms' service description. The new wording must not overpromise or misdescribe processing; the AI search still runs and its data flows are unchanged, so the Doel row must keep mentioning it (the proposed copy does).
- **Dutch copy (schedule `/dutch-copy`)**: full sweep of new strings before done — je/jij consistency, no em dashes, no "geen creditcard nodig".
- **Stylist (schedule `/stylist`)**: homepage renders changed string lengths (heroBadge, step3Title, stat labels); check nothing wraps badly on mobile.
- No `/security` needed: zero backend/endpoint changes.
- Regression risk: mistranslating a placeholder token breaks next-intl at runtime — the key-parity + build check catches missing keys, builder must additionally grep changed locale files for the placeholders listed in step 8.
- The FAQ interview-prep answer describes the just-shipped feature (PR #149); builder should skim `SollicitiesPage.viewPrep` flow to confirm the described trigger ("markeer als Uitgenodigd voor gesprek") matches actual behavior before shipping the copy.

## Acceptance criteria (checkable by the tester agent — commands to run, states to observe)
All commands from `C:\Users\donn9\Opstap.App`.

1. `grep -c "Vind vacatures" web/messages/nl.json` → 0.
2. `grep -c "zoekt op de grootste Nederlandse jobboards" web/messages/nl.json` → 0.
3. `grep -c "We zoeken voor jou op Indeed" web/messages/nl.json` → 0.
4. `grep -c "Zoek vacatures, keur je brief" web/messages/nl.json` → 0.
5. `grep -c "Plak een vacaturelink, wij doen de rest" web/messages/nl.json` → ≥1 (heroBadge).
6. `grep -c "section2Q5" web/messages/nl.json web/messages/en.json web/messages/pl.json web/messages/ro.json web/messages/tr.json web/messages/uk.json` → 1 per file, and `grep -c "section2Q5" web/src/app/faq/page.tsx` → ≥1 (rendered).
7. `grep -rc "zoek vacatures en solliciteer" web/src/app/layout.tsx web/src/app/page.tsx` → 0; `grep -c "Plak een vacaturelink" web/src/app/layout.tsx` → ≥1.
8. `grep -c "Automatisch solliciteren op Nederlandse vacatures met AI" web/src/app/opengraph-image.tsx` → 0.
9. AI search untouched: `grep -c "Zoek vacatures" web/messages/nl.json` → exactly 1 (`DashboardClient.searchButton`); `grep -c "searchingTitle" web/messages/nl.json` → 1 with value still starting `AI zoekt vacatures`.
10. Testimonials untouched: `git diff master -- web/messages/nl.json | grep -c "testimonial.*Quote"` → 0.
11. Slogan untouched: `grep -c "Meer kansen. Minder moeite." web/messages/nl.json` → same count as on master.
12. All 6 locale JSONs parse and are key-complete vs nl.json (step 9 parity script exits 0).
13. `cd web && npx tsc --noEmit` passes and `npm run build` succeeds.
14. Browser spot-check (tester, max 3 pages): homepage shows new heroBadge + step 3 mentioning gespreksvoorbereiding; `/faq` shows the interview-prep Q&A; dashboard sidebar nav shows "Solliciteren" and the AI search is still reachable and labeled as search.
