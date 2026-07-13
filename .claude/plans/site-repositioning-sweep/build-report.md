# Build report: site-repositioning-sweep
Status: built
Branch: feat/site-repositioning-sweep

## What was implemented (per plan step)

- **Step 1 (HomePage nl.json)** — done. All 11 keys updated verbatim from the plan (`heroBadge`, `readyWithJobTitle`, `featureMultipleVacancies`, `step1Desc`, `step3Title`, `step3Desc`, `stat1Label`, `stat1Sub`, `stat4Sub`, `ctaLoggedInSubtitle`, `ctaLoggedOutSubtitle`). `featurePersonalLetter`, `featureSendMethods`, `recruiterBannerDesc`, `stat2*`/`stat3*`, testimonials, CTA titles, buttons untouched.
- **Step 2 (nav labels)** — done. `PublicShell.navVindVacatures` and `DashboardShell.navVindVacatures` → "Solliciteren" (key name kept). Confirmed both render with `href="/dashboard"` (PublicShell.tsx:56, DashboardShell.tsx:117-118). `navOpgeslagenVacatures` untouched.
- **Step 3 (FAQ)** — done. `section1A1` replaced; `section2Q5`/`section2A5` added after `section2A4` in all 6 locales; render added in `web/src/app/faq/page.tsx` (new line after section2Q4 item, same pattern). Verified feature accuracy: `SollicitiesPage.statusInterview` / `selectOptionInterview` = "Uitgenodigd voor gesprek" and prep headings (`prepCompanyHeading`, `prepLikelyQuestionsHeading`, …) match the FAQ answer's description.
- **Step 4 (OverOnsPage)** — done. `section1Para1`, `section3Para1`, `ctaSubtext` replaced verbatim. Rest untouched.
- **Step 5 (dashboard/onboarding CTAs)** — done, all 7 keys. Destination checks: `WelkomPage.searchJobsButton` calls `finish()` → `router.replace('/dashboard')` (welkom/page.tsx:88-92); `SollicitiesPage.emptyStateCta` is a `<Link href="/dashboard">` (sollicitaties/page.tsx:131); `Achievements.achievementApplyCta` has `href: '/dashboard'` (Achievements.tsx:57). None triggers the AI search directly, so all labels changed as planned.
- **Step 6 (legal accuracy)** — done. `PrivacyPage.tableRow1Doel` and `VoorwaardenPage.section1Body` replaced verbatim. Row context checked: `tableRow1Grondslag` = "Uitvoering overeenkomst", consistent with the new Doel (letters + sending + optional AI search are all contract performance). No `tableRow1Bewaartermijn` key exists (row has only Doel/Grondslag cells).
- **Step 7 (SEO metadata)** — done. `layout.tsx`: all 3 descriptions (metadata/openGraph/twitter) replaced with the new sentence; title kept. `page.tsx`: jsonLd description (line 18, the only old-description occurrence in that file) replaced with the same sentence. `opengraph-image.tsx` line 57 → "Plak een vacaturelink, wij doen de rest."; `alt` and "Meer kansen." headline untouched. `RegisterPage.pageDescription` checked: "Maak een Opstap-account aan en begin automatisch te solliciteren op Nederlandse vacatures." — apply-focused, no job-search promise, left unchanged. OverOns `pageDescription` already fine.
- **Step 8 (translations)** — done. All changed/added keys translated into en, pl, ro, tr, uk from the new Dutch. `{functietitel}` preserved in all 6 `readyWithJobTitle` values; no other changed key carried a placeholder. Applied via script with round-trip-safe JSON re-dump (verified byte-identical round-trip per file before editing; CRLF line endings preserved) so diffs are minimal (54 lines per locale file).
- **Step 9 (verify)** — done, see Checks run.

### Deviations
- Acceptance criterion 10 as literally written (`git diff master ... | grep -c "testimonial.*Quote"`) returns 1, but the match is an unchanged **context line** in the diff hunk. `git diff master -- web/messages/nl.json | grep -c '^[+-].*testimonial.*Quote'` → 0: no testimonial line was added or removed. Testimonials are untouched.
- Ukrainian `VoorwaardenPage.section1Body` uses "Opstap є сервісом" instead of the more natural "Opstap — це сервіс" to respect the no-em-dash rule.

## Files changed
- `web/messages/nl.json` — 24 keys changed + 2 added (FaqPage.section2Q5/A5)
- `web/messages/en.json`, `pl.json`, `ro.json`, `tr.json`, `uk.json` — same key set, translated
- `web/src/app/faq/page.tsx` — 1 line added (section2Q5/A5 render)
- `web/src/app/layout.tsx` — 3 description strings
- `web/src/app/page.tsx` — jsonLd description
- `web/src/app/opengraph-image.tsx` — subtitle string

## Checks run (commands + results)
- All 6 locale JSONs parse (json.load) — pass.
- Key-parity script (scratchpad): en/pl/ro/tr/uk each key-identical to nl.json — pass. Placeholder check (`{functietitel}` in readyWithJobTitle, all locales) — pass. Em-dash scan across all touched namespaces, all locales — zero.
- Acceptance greps 1-9, 11: all pass exactly as specified (1-4: 0 hits; 5: 1; 6: 1 per locale + rendered in faq/page.tsx; 7: 0 old / 3 new in layout.tsx; 8: 0; 9: "Zoek vacatures" exactly 1 = DashboardClient.searchButton, searchingTitle still "AI zoekt vacatures voor je…"; 11: "Meer kansen. Minder moeite." count 3 on branch and on master).
- Criterion 10: see deviation above (0 changed lines).
- `npx tsc --noEmit` — pass.
- `npx eslint` on the 4 changed TSX files — 2 pre-existing errors in `page.tsx:241` (react/no-unescaped-entities) and 1 pre-existing warning in `faq/page.tsx` (unused Link import). Verified identical with my changes stashed — pre-existing on the branch baseline, not introduced, not fixed (scope discipline).
- `npm run build` — pass, all 38 routes build.

## Notes for tester
- Homepage (`/`): heroBadge pill, step 1/3 cards, stats row, both CTA subtitles — new copy; check heroBadge and step3Title don't wrap badly on mobile (stylist item from the plan).
- `/faq`: section 2 now has 5 items; the new Q&A is last in that section.
- Dashboard sidebar + public nav: "Solliciteren" label, still links to `/dashboard`; AI search below the paste-link card still says "Zoek vacatures" (untouched by design).
- Onboarding (`/dashboard/welkom`): step 3 instruction + button "Start met solliciteren →" (button completes onboarding → /dashboard).
- `/privacy` table row 1 Doel and `/voorwaarden` section 1: legal wording — /avg-checker should look here.
- SEO: view-source description on any page, and `/opengraph-image` subtitle.
- Seams most likely to break: non-NL locales (machine-translated by builder, native review recommended for pl/ro/tr/uk); the FAQ answer's claim about marking "Uitgenodigd voor gesprek" (verified against i18n labels but not browser-exercised).
- Pre-existing, out of scope: eslint errors at `web/src/app/page.tsx:241`, unused `Link` import in `faq/page.tsx`, untracked `web/src/middleware.ts` in the working tree (not part of this build).
