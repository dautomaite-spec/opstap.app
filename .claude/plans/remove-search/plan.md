# Remove AI job search — Opstap becomes the application assistant
Status: planned

## Why (1-3 sentences, tied to the strategy)
Product owner decision per the strategy memo (2026-07-12): the promise is "paste a vacancy link, we do the rest" — search is the only adversarial, expensive (unmetered Claude+Tavily per search), fragile part of the product and no longer the promise. Killing it removes cost and breakage surface while the funnel that matters (letter → send → reply → interview) stays. This plan also closes two gaps that removal exposes: (1) the paste-a-link flow creates **no application row** today, so approval, sollicitaties tracking, and interview prep never fire for it; (2) an existing data-loss bug where the daily jobs-cleanup cron cascade-deletes applications.

## Scope — in
- Backend: delete the search engine, scrapers, search endpoint, saved-jobs endpoints, dead-link reporting, search-summary ("zoekprofiel") generation, job digest + prefetch crons, search diagnostic scripts.
- Backend: upgrade `POST /apply/from-url` (both URL and paste-text branches) to create a `jobs` row + draft `application` and return `application_id`, so the paste flow plugs into the existing approve/send gate and interview prep.
- Migration `018`: fix the `cleanup-stale-jobs` pg_cron so it never deletes jobs referenced by applications (existing cascade-delete bug).
- Web: remove search UI, filters/sorting, multi-apply, saved-jobs page + nav, jobs localStorage caches; give the paste-flow result the approve/send (site + email) actions; remove search-only i18n keys across all 6 locales; final copy sweep removing every remaining "de AI kan ook zoeken" mention.
- Dependencies: drop `playwright` from `backend/requirements.txt` (only `job_scraper.py` justified it; nothing in `backend/app/` imports it). **Keep `tavily-python` and `TAVILY_API_KEY`** — `services/interview_prep.py` uses Tavily for company lookup.
- Docs/agents: delete `.claude/agents/scraper-health.md`, delete `docs/n8n-vacancy-polling-workflow.json`, update `CLAUDE.md` (agent table, stack table, MVP scope, key decisions).

## Scope — out (explicitly)
- **Do NOT drop any table or column.** `jobs`, `saved_jobs`, `profiles.job_search_summary(_approved_at)`, `profiles.email_digest_enabled` all stay. Users' saved-jobs data is retained (page removed, data kept). Column drops are a later cleanup once stable.
- Flutter app (`opstap/`): deferred until 500 MAU per strategy; its job-search screens stay untouched and unshipped. Do not edit `opstap/lib/**`.
- Blog articles under `web/src/app/blog/` (separate SEO sweep if ever).
- Supabase edge functions (`cleanup-expired-cvs` etc.) — they only null `job_search_summary`, which is harmless with the columns kept.
- Migrations 012/014/015 are history — never edit applied migrations.
- No pricing, no new features. Interview prep, credits, admin panel logic (beyond digest/prefetch removal) unchanged.

## Implementation steps (ordered; per step: files to touch, what changes)

### Step 1 — Backend: paste flow creates a tracked draft application
File: `backend/app/api/v1/apply.py`.
- In `letter_from_url` (POST `/apply/from-url`), after successful letter generation in **both** branches (scraped-URL path and `job_text` fallback path), before returning:
  1. Insert a `jobs` row: `{id: uuid4, title, company, location: None, source: "paste", url: body.url, description_snippet: description[:500] (the sanitized/extracted description), scraped_at: now}` — upsert `on_conflict="url"` and reuse the existing row's id on conflict (same pattern as `jobs.py` line 297 today; fetch id via the upsert response or a follow-up select on url).
  2. Create/refresh a draft application exactly like `POST /letter` lines 148-182 does (reuse: extract that block into a module-level helper `_upsert_draft_application(supabase, user_id, job_id, job_title, company, letter) -> draft_id` and call it from both `/letter` and `/from-url`).
- Extend `UrlLetterResponse` with `application_id: str` and `job_id: str`.
- No new credit logic — the existing debit/refund paths stay byte-identical.
- `POST /apply/letter`, `/approve`, `/stats`, `/history`, `/status`, `/rating` stay. `/approve`'s email branch reads `jobs.contact_email` for the draft's job_id (line 289) — the new paste-created jobs rows have no `contact_email`, which is fine: the web flow always passes `contact_email_override`.
- Defensive check while here: `services/interview_prep.py` line 119 reads the `jobs` row for `description_snippet` — verify it tolerates a missing/empty jobs row (legacy applications whose job was cron-deleted); if it would KeyError/IndexError, guard it.

### Step 2 — Migration 018: stop the jobs-cleanup cron from cascade-deleting applications
New file: `backend/supabase/migrations/018_jobs_cleanup_preserve_applications.sql`, applied via `mcp__supabase__apply_migration` on project rwwumtwelwncdqmvhdkt.
- `applications.job_id` is `NOT NULL REFERENCES jobs(id) ON DELETE CASCADE` (001) and migration 006 schedules daily `DELETE FROM jobs WHERE scraped_at < NOW() - INTERVAL '7 days' AND id::text NOT IN (SELECT job_id FROM saved_jobs)`. **This deletes sent applications older than 7 days.** Fix:
  1. `cron.unschedule('cleanup-stale-jobs')` (wrapped in the same tolerant DO block as 006).
  2. Re-schedule with the additional exclusion: `AND id NOT IN (SELECT job_id FROM applications)` (keep the saved_jobs exclusion too — data is retained).
  3. Change the FK as belt-and-braces: `ALTER TABLE applications DROP CONSTRAINT applications_job_id_fkey; ALTER TABLE applications ADD CONSTRAINT applications_job_id_fkey FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE RESTRICT;` (constraint name to be verified by builder via `\d applications` / information_schema).

### Step 3 — Backend: delete the search engine
- Delete files: `backend/app/services/llm_job_search.py`, `backend/app/services/job_scraper.py`, `backend/app/api/v1/jobs.py`, `backend/app/schemas/job.py` (after step 1, grep confirms no remaining importer — `JobOut`/`JobSearchParams` are only used by jobs.py).
- `backend/app/api/v1/router.py`: remove the `jobs_router` import and `include_router` line.
- Removing jobs.py also removes: saved-jobs endpoints (`/jobs/saved/*`), `GET /jobs/{job_id}`, `POST /jobs/{job_id}/report-dead`, the in-process `_LLM_HOURLY_LIMIT` rate limiter. None have non-search web callers after step 7.
- `backend/app/core/config.py` line ~30: keep `tavily_api_key` but change the comment to `# Tavily web search (interview prep company lookup)`.
- `backend/requirements.txt`: remove `playwright==1.49.1`. Keep `beautifulsoup4` (from-url) and `tavily-python` (interview prep).
- `backend/app/api/v1/apply.py` line ~496: update the comment that references `_DEAD_CONTENT_SIGNALS in llm_job_search.py` (file gone).

### Step 4 — Backend: remove job digest + prefetch (discovery features)
File: `backend/app/api/v1/admin.py`.
- Remove `from app.services.job_scraper import scrape_adzuna, scrape_indeed_nl` (line 27), the `/cron/job-digest` endpoint and its helper loop (lines ~440-516), `_POPULAR_NL_SEARCHES`, `_run_prefetch`, and `/cron/prefetch-jobs` (lines ~519-575). Remove `send_job_digest` from the imports on line 28.
- `backend/app/services/email_notifications.py`: delete `send_job_digest` (line ~363).
- Whatever external scheduler calls these cron endpoints (n8n / cron-job.org) must stop: delete `docs/n8n-vacancy-polling-workflow.json`; add a line to the build report reminding the user to disable any live n8n workflow / external cron hitting `/api/v1/admin/cron/job-digest` and `/cron/prefetch-jobs` (we cannot verify externally).
- Web `SettingsClient.tsx` (`web/src/app/dashboard/settings/`): remove the email-digest toggle row and its `email_digest_enabled` handling (lines ~49, 77-86); remove its i18n keys (grep `SettingsPage` namespace for the digest strings). Keep `email_reminders_enabled` and `cv_expiry_reminder_enabled` toggles. Keep the `email_digest_enabled` field in `api.ts` Profile type removal is fine since column stays but nothing reads it — remove from the TS types.

### Step 5 — Backend: remove the search-summary ("zoekprofiel") generator
Its only consumer was the LLM search prompt; it costs a Claude call on every profile/CV update.
- Delete `backend/app/services/search_summary.py`.
- `backend/app/api/v1/profile.py`: remove routes `POST /search-summary` (line 259) and `POST /search-summary/approve` (line 275); remove the `regenerate_search_summary` import (line 21) and the three `fire_and_forget(regenerate_search_summary(...))` calls (lines ~120, ~162, ~428). Keep `job_search_summary` in the AVG export field list (line 215) and in the delete-account nulling (line ~423) — stored data must remain exportable/deletable.
- `backend/app/services/cv_parser.py` lines ~73-74: remove the `regenerate_search_summary` import + call.
- Keep `job_search_summary` fields in `backend/app/schemas/profile.py` (read-only exposure of existing data; client-write lockdown from 016 unchanged).
- Web: `web/src/lib/api.ts` remove `generateSearchSummary` / `approveSearchSummary` (lines 57-58); `web/src/app/dashboard/profiel/page.tsx` remove the zoekprofiel section (around lines 280 and 630 — `searchProfileSectionTitle/Desc`, `summaryGenerateButton`, `summaryHint`, `summaryErrorFallback`, consent bullet about search if present) and the related state/handlers.

### Step 6 — Backend: delete search diagnostics
Delete `backend/scripts/test_job_search_extraction.py`, `backend/scripts/verify_job_links.py`, `backend/scripts/debug_parse_failure.py`. Keep `backend/tests/test_from_text_fallback.py` (paste flow — update it if step 1 changes the response shape: it must now also assert `application_id` is returned).

### Step 7 — Web: dashboard becomes paste-only, with approve/send
File: `web/src/app/dashboard/DashboardClient.tsx` (major rewrite).
Remove:
- All search machinery: `triggerSearch`, `handleNewSearch`, auto-search after profile create (line ~298), `searching`/`searchError`/`sortBy`/`jobsStale`/`minAnimDone` state, the 5s search animation, `LAST_SEARCH_KEY`.
- Jobs list rendering, sidebar filters (`filterContracts`, `filterCurveball`), sorting, `sortedJobs`/`filteredJobs`, expand/multi-select (`multiSelect`, `selectedIds`, `toggleJobSelect`, `exitMultiSelect`), `MultiApplyModal` usage — multi-apply only operates on search results, so it goes entirely.
- Saved jobs: `savedJobs` state, `toggleSave`, `listSaved` effect, `SAVED_JOBS_KEY`; dead-link reporting `reportDead`; localStorage caches `CACHED_JOBS_KEY`, `PENDING_APPLY_KEY` (also remove the pending-apply read in the profile effect, lines ~223-233).
- Helpers left unused after the above: `inferIsCurveball`, `matchScore`, `parseSalary`, `loadSavedJobsLocal`/`writeSavedJobsLocal`/`loadCachedJobs`/`writeCachedJobs`, `jobAgeDays`, `formatDate` (delete only if no remaining caller).
- The search-anchored letter modal (`applyState`, `handleGenerateLetter`, `handleSendViasite`, `handleSendViaEmail`) — **but port its send logic** to the paste flow below before deleting.

Add/repurpose (the paste result block at lines ~647-680):
- `urlLetterResult` state gains `application_id` and `job_id` from the step-1 response.
- Under the letter textarea, replace copy-only buttons with the real gate: "Kopieer en open vacature" now also calls `api.apply.approve(application_id, { send_method: 'site', letter_nl })` before `window.open` (port from `handleSendViasite`); add the "Verstuur per e-mail" expander with recipient input calling `approve` with `send_method: 'email'`, `contact_email_override` (port from `handleSendViaEmail` + the existing email UI in the letter modal). Keep the plain copy button. Track `Application Sent` PostHog event as today.
- Keep untouched: paste-link form, paste-text fallback, writing style selector, profile form, BuyCreditsModal, Achievements, credits display.

Delete files: `web/src/app/dashboard/components/MultiApplyModal.tsx`, `web/src/app/dashboard/opgeslagen/page.tsx` (whole directory).
Nav: remove the opgeslagen entries in `web/src/app/dashboard/components/DashboardShell.tsx` (line ~127), `web/src/app/components/PublicShell.tsx` (line ~57), `web/src/app/components/PublicMobileMenu.tsx` (line ~10, hardcoded label).
`web/src/lib/api.ts`: remove the whole `jobs:` section (`search`, `searchWithStale`, `listSaved`, `save`, `unsave`, `reportDead`), the `Job` and `JobSearchParams` types, `is_curveball`/`match_score` fields; update `fromUrl`'s return type with `application_id`/`job_id`. Keep `apply.generateLetter` + `LetterRequest` only if something still calls it after this step — expect **no callers**: then remove them and keep the backend `/letter` endpoint (harmless, still the draft-gate reference implementation) — do not remove backend `/letter`.
Check `web/src/app/dashboard/welkom/page.tsx`: `finish` only navigates to `/dashboard` — keep, but re-label via i18n in step 8.

### Step 8 — i18n: remove search keys, fix remaining search copy (all 6 locales: nl, en, pl, ro, tr, uk in `web/messages/`)
- Delete namespaces: `OpgeslagenPage` (nl.json line ~785), `MultiApplyModal` (line ~850).
- Delete all `DashboardClient` keys that no longer have a caller after step 7 (method: after code edits, script-grep every `DashboardClient.*` key name against `web/src`; delete unreferenced ones — includes `searchButton`, `searchAgainButton`, `searchingTitle`, `noJobsFound`, `searchQueryDisplay`, sort/filter labels, `saveJobTooltip`, `unsaveJobTooltip`, `reportDeadTooltip`, curveball/stale strings). Same for the removed `ProfielPage` zoekprofiel keys and `SettingsPage` digest keys.
- Add keys the new paste-flow send UI needs (reuse deleted letter-modal strings where the Dutch already exists, e.g. email send labels/success/error).
- Copy fixes (final Dutch, translate to the other 5; informal je/jij, no em dashes, never "geen creditcard nodig"):
  - `FaqPage.section1A1`: `Opstap solliciteert voor je. Zie je een vacature op Indeed, LinkedIn of een bedrijfssite? Plak de link en Opstap schrijft een persoonlijke motivatiebrief, verstuurt je sollicitatie en bereidt je voor op het gesprek. Jij keurt alles goed voordat er iets de deur uit gaat.`
  - `InvitePage.step2Body`: `Zag je een vacature op Indeed, LinkedIn of een bedrijfssite? Plak de link en Opstap doet de rest: brief, verzending en gespreksvoorbereiding.`
  - `WelkomPage.step3Instruction`: `Plak een vacaturelink en laat Opstap je brief schrijven. Staat de vacaturetekst niet online? Plakken kan ook.`
  - `WelkomPage.searchJobsButton` value: `Plak je eerste vacaturelink →` (key name kept, renaming across 6 locales is churn).
  - `PrivacyPage.tableRow1Doel`: `Motivatiebrieven schrijven, sollicitaties versturen en je voorbereiden op gesprekken` (builder: keep grondslag/bewaartermijn cells consistent).
  - `VoorwaardenPage.section1Body`: `Opstap is een dienst die werkzoekenden in Nederland helpt bij het solliciteren: het schrijven van motivatiebrieven met behulp van kunstmatige intelligentie, het versturen van sollicitaties en het voorbereiden op sollicitatiegesprekken. Door gebruik te maken van Opstap ga je akkoord met deze voorwaarden.`
  - Sweep check: `grep -in "zoek\|search" web/messages/nl.json` and judge each remaining hit — profile field hints about functietitels are fine (they feed the letter), anything promising job *discovery* goes.

### Step 9 — Agents and project docs
- Delete `.claude/agents/scraper-health.md`.
- `CLAUDE.md`: remove the `/scraper-health` row from the agent table; stack table row `Job scraping | Playwright` → remove; MVP list item 3 `Job search (NL boards)` → replace with `Paste a vacancy (link or text)`; key decisions: replace `Dutch job boards: Indeed NL, LinkedIn NL, Jobbird, Nationale Vacaturebank` with `Works with any Dutch vacancy: user pastes a link (or the text) from any job board or company site`; update "What is this project?" sentence (`search Dutch job boards, and auto-apply` → `paste a vacancy link, and auto-apply`).
- Leave `docs/PROGRESSMAP.html` / roadmap / changelog to `/updater` before push (standard loop).

## Data changes (migrations, applied how)
- `018_jobs_cleanup_preserve_applications.sql` (step 2): unschedule + reschedule `cleanup-stale-jobs` pg_cron with an applications exclusion; retarget `applications_job_id_fkey` to `ON DELETE RESTRICT`. Applied via `mcp__supabase__apply_migration` (project rwwumtwelwncdqmvhdkt) and committed to `backend/supabase/migrations/`.
- No drops, no column changes. `jobs` gains rows with `source='paste'` (existing columns only). `saved_jobs` data retained untouched.

## Risks & security/AVG notes (what could leak, break, or need consent)
- **FLAGGED GAP (fixed by steps 1+7): `/apply/from-url` currently returns a letter with NO application row** — no approval gate record, no sollicitaties tracking, no interview prep for the hero flow. After this plan it creates a draft + goes through `/approve` like everything else. If steps 1+7 were deferred, killing search would leave the product with zero tracked applications going forward — do not split them out.
- **FLAGGED EXISTING BUG (fixed by step 2): daily pg_cron deletes jobs >7 days old unless saved, and `applications.job_id` is ON DELETE CASCADE — sent applications older than 7 days have likely been silently deleted.** Builder should query how many applications exist vs. expectations and note findings in the build report; historical rows are unrecoverable.
- **`/security` release gate required**: `apply.py` is modified (from-url now writes jobs + applications rows) and `admin.py`/`profile.py` endpoints are removed. Verify the jobs upsert can't be abused (rate limit `check_and_increment_letter` already guards from-url), and that removed routes 404 cleanly.
- **`/avg-checker` release gate required**: privacy policy + terms copy change (step 8) must match actual processing (no more job-search processing, digest emails stop); `job_search_summary` stays exportable/deletable; pasted vacancy text still flows through `sanitize_and_check_job_text`; new jobs rows from pasted URLs contain no personal data (title/company/description only — builder must NOT store the raw pasted `job_text` in the jobs row beyond the 500-char snippet).
- **`/dutch-copy` + `/stylist` release gates required**: dashboard is heavily restructured; new/changed Dutch strings in 8 files.
- External cron/n8n may still hit the removed `/cron/job-digest` / `/cron/prefetch-jobs` endpoints → they will 404 harmlessly, but the user must disable the schedules (surfaced in build report; cannot be done from the repo).
- Legacy users: bookmarked `/dashboard/opgeslagen` → 404. Acceptable; optionally the builder may add a redirect to `/dashboard` if trivial in this Next.js version.
- Interview prep reads the jobs row (interview_prep.py line 119): legacy applications whose job row was cron-deleted must not crash prep regeneration (step 1 defensive check).
- Locale parity: any key deleted in nl.json must be deleted in all 5 others or next-intl/tsc noise follows — parity script in acceptance criteria.

## Acceptance criteria (checkable by the tester agent — commands to run, states to observe)
All from `C:\Users\donn9\Opstap.App` unless noted.

1. Deleted symbols gone: `grep -rn "llm_job_search\|job_scraper\|llm_search_jobs\|scrape_adzuna\|scrape_jobbird\|scrape_indeed" backend/app backend/tests backend/scripts` → 0 hits. `test -f backend/app/api/v1/jobs.py` → missing; same for `backend/app/services/llm_job_search.py`, `job_scraper.py`, `search_summary.py`, the 3 `backend/scripts/` files, `docs/n8n-vacancy-polling-workflow.json`, `.claude/agents/scraper-health.md`.
2. Tavily kept for prep only: `grep -rn "tavily" backend/app` → hits only in `services/interview_prep.py` and `core/config.py`. `grep -n "tavily-python" backend/requirements.txt` → 1; `grep -n "playwright" backend/requirements.txt` → 0.
3. Backend compiles + imports: `python -m compileall backend/app -q` exits 0; `cd backend && python -c "from app.main import app; print([r.path for r in app.routes])"` succeeds, output contains `/api/v1/apply/from-url` and does NOT contain `/api/v1/jobs/search`, `/jobs/saved`, `/search-summary`, `/cron/job-digest`, `/cron/prefetch-jobs`.
4. Tests: `cd backend && python -m pytest tests/ -q` passes (including updated `test_from_text_fallback.py` asserting `application_id` in the from-url/text response).
5. From-url creates a draft: in `test_from_text_fallback.py` (or a new test with mocked supabase), the paste-text path calls the applications insert with `status='draft'` and a `job_id` referencing the upserted jobs row.
6. Migration: `backend/supabase/migrations/018_jobs_cleanup_preserve_applications.sql` exists, is in `mcp__supabase__list_migrations` output for rwwumtwelwncdqmvhdkt, and `SELECT command FROM cron.job WHERE jobname='cleanup-stale-jobs'` (via `mcp__supabase__execute_sql`) contains `applications`.
7. Web symbols gone: `grep -rn "searchWithStale\|MultiApplyModal\|opgeslagen\|CACHED_JOBS_KEY\|SAVED_JOBS_KEY\|PENDING_APPLY_KEY\|reportDead\|matchScore\|inferIsCurveball\|parseSalary" web/src` → 0 hits (case-sensitive; `opgeslagen` also checks nav hrefs).
8. Web builds: `cd web && npx tsc --noEmit` and `npm run build` succeed.
9. Locale parity: script (scratchpad) asserting the `namespace.key` set of each of en/pl/ro/tr/uk equals nl.json → exits 0; all 6 JSONs parse. `grep -c "OpgeslagenPage\|MultiApplyModal" web/messages/nl.json` → 0. `grep -ci "de AI vindt vacatures\|AI zoekt vacatures\|laten zoeken" web/messages/nl.json` → 0.
10. CLAUDE.md: `grep -c "scraper-health\|Job search (NL boards)\|Playwright" CLAUDE.md` → 0.
11. Regression checklist (tester Mode 2, dev server or preview; max 3 link checks per run):
    - Paste-link flow: paste a real vacancy URL → letter renders → "Kopieer en open vacature" marks it sent (row appears on `/dashboard/sollicitaties` with correct company/title).
    - Paste-text fallback: blocked-page path shows textarea; ≥200 chars → letter → send via email with an override address → status `sent`/`pending`.
    - Interview prep: after send, prep generates for that application (sollicitaties page shows it after status → interview).
    - Sollicitaties page + `/apply/stats` counts render; credits balance decrements exactly 1 per letter; profile + CV upload/parse works (no search-summary call fires — check backend logs show no `search_summary` errors); admin panel loads; AVG export downloads and still contains `job_search_summary`; account delete works.
    - Dashboard shows no search button, no filters, no saved-jobs nav anywhere (logged-in and public shells).
