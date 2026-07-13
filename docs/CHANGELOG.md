# Changelog — Opstap

## 2026-07-11 (fix/scrapers-and-reviews)
- fix(security): sanitize all CV-extracted text (vaardigheden/werkervaring/samenvatting) before it enters search-summary prompts; injection-flagged fields dropped instead of aborting regeneration (5032000)
- fix(security): migration 016 revokes client PostgREST write access on profiles — server-managed columns (job_search_summary, is_suspended, credits_balance) were writable by any authenticated user with the anon key
- fix(security): report-dead rate limit (10/h per user) — one user could mark the entire shared job pool dead
- feat(security): first-strike suspension on prompt-injection attempts in user-typed fields (profile free text, custom letter notes); CV content and letter edits excluded as false-positive sources; reversible via admin; suspended accounts blocked from job search + summary generation
- fix(avg): CV-derived search summary no longer outlives the CV — cleared on manual delete and auto-expiry (migration 015 + storage edge function v2, which also clears cv_structured)
- fix(avg): consent copy extended to cover the search-profile purpose — Flutter consent screen + web consent modal, all 6 locales
- fix(avg): AVG Art. 20 data export repaired — endpoint selected three nonexistent columns (job_titles, salary_min, salary_max) so every export 500'd in production; export now includes job_search_summary_approved_at + cv_structured
- fix: proper diacritics for pl/ro/tr summary strings (dutch-copy review)
- feat: job search supplement path now uses Jobbird + Adzuna API per profile title — Nationale Vacaturebank removed (Akamai bot wall), Indeed removed (403s from datacenter IPs)
- chore: agent roster overhaul (.claude/agents/) — stylist rewritten against the real indigo/lavender design system from web globals.css; tester agent given hard cost limits (max 3 browser link checks, timestamped reports, single profile per run); new scraper-health agent for cheap script-based pipeline checks; progress-reporter agent removed; CLAUDE.md agent table updated

## 2026-07-11 (fix/job-search-quality-and-summary)
- fix: job URL hallucination — reject job URLs not found in Tavily results before returning them to the user (edc8b64)
- fix: LLM job search company/location extraction — was showing "Onbekend"/wrong city
- feat: match_score (0-100) wired end-to-end from llm_job_search.py through jobs.py to job cards
- fix: 8/10 composite quality gate added to reject low-confidence LLM search results
- fix: JSON-parse failure causing ~40% zero-result searches
- fix: LinkedIn silent expired-listing redirect (trk=expired_jd_redirect) now detected instead of treated as alive
- feat: werkenvoornederland.nl unblocked as a search source
- fix: Jobbird scraper company/location CSS selectors and card-scoping logic (site markup changed, was returning "Onbekend" for 100% of results)
- feat: search_summary.py — AI search-profile summary enriched with CV-structured data (samenvatting/vaardigheden/werkervaring), not just manual profile fields
- feat: search summary regeneration auto-triggers (fire-and-forget) after profile create/update and after CV parsing; new POST /profile/search-summary/approve endpoint
- fix: job_search_summary removed from client-writable ProfileCreate/ProfileUpdate schema (was a data-integrity gap); job_search_summary_approved_at added server-only (migration 014)
- fix: dashboard Enter-key premature form submit on job-title inputs
- fix: stale "complete your profile" banner (was gated on job_search_summary presence instead of actual field completeness)
- feat: profile page — AI search summary moved to bottom of both tabs, made read-only with "I agree" acknowledgment instead of a gate, polling added for async server-side generation
- chore: backend/scripts/ — diagnostic scripts for job search extraction, link liveness, and parse-failure debugging

## 2026-07-03 (feat/job-search-preferences)
- fix: add Jouw sollicitaties link to PublicShell sidebar nav — SidebarNavLink + navJouwSollicitaties i18n key added to all 6 translation files (nl/en/tr/uk/pl/ro)
- fix(security): harden search-summary endpoint against prompt injection — multiple detection patterns, output scrubbed before DB write, 422 on detected injection
- feat: richer search profile + AI-generated search summary — migration 012 adds 6 new profile columns (job_background, job_company_size, job_culture, job_role_type, job_avoids, job_search_summary); backend POST /profile/search-summary via Claude Haiku with rate limiting, prompt injection protection, output validation; profile page new "Zoekprofiel" section + dashboard summary card
- feat: job search preferences field — new profile field to scope search results without excluding job titles; preference used as soft LLM context, not a hard filter
- feat: full site i18n — NL/EN/TR/UK/PL/RO translations via next-intl; all UI strings migrated to t('key') calls; language switcher fully functional for all 6 locales
- feat: remove LinkedIn from job scrapers — scrape_linkedin_nl() removed from asyncio.gather(); cached LinkedIn URLs filtered from DB results (cloud-IP ban made scraper non-functional)

## 2026-06-29 (PR #135 — LinkedIn warning + loading spinners)
- feat: orange LinkedIn warning banner shown in the letter modal when the job URL contains linkedin.com — warns user that manual submission is required
- feat: loading spinners added to Solliciteren, Opnieuw genereren, and Kopieer & solliciteer buttons — prevents double-clicks and shows progress state during API calls

## 2026-06-29 (PR #134 — language switcher trim)
- fix: language switcher trimmed to NL / EN / TR / UK / PL / RO — removed languages with no immediate roadmap (AR, DE, FR) to reduce visual noise (#134)

## 2026-06-29 (PR #133 — sector display + search header titles)
- fix: "andere sector" label now displays correctly in search filter sidebar — was showing raw enum value (#133)
- fix: all profile job titles shown in the search results page header instead of only the first title (#133)

## 2026-06-29 (PR #132 — cv_structured job title supplement)
- feat: profile job titles supplemented from cv_structured during search when profile functietitel fields are empty — improves auto-search quality for users who uploaded a CV but did not fill in job titles manually (#132)

## 2026-06-29 (PR #131 — filter sidebar right side)
- feat: job search filter sidebar moved to the right side of the job listings panel — matches conventional job board layout and frees left side for the job cards (#131)

## 2026-06-29 (PR #130 — last 2-3 job titles scraper fallback)
- fix: scraper fallback and CV import now use the last 2-3 job titles from cv_structured (most recent roles) instead of the full list — improves relevance of fallback searches (#130)

## 2026-06-28 (PRs #128-#129 — profile-driven search + homepage personalisation)
- feat: profile-driven search — job search now uses all three profile job titles as query terms, not just the first; search header shows which titles are active (#129)
- feat: CV import to profile — cv_structured data can be imported into profile fields from the profile page (#129)
- feat: homepage shows full marketing content when logged in, swapping only the hero section for a personalised welcome (#128)
- feat: personalised welcome screen on homepage when logged in — shows user's name and direct CTA to dashboard (#127)

## 2026-06-28 (Dutch copy fixes + marketing roadmap)
- fix: DashboardClient.tsx — 7 Dutch copy corrections: button labels, loading ellipsis, singular/plural (sollicitatie vs sollicitaties), sidebar heading, curveball label consistency, credit cost format
- docs: ROADMAP.html — expanded Marketing & Groei section with monetisation strategy (Mollie iDEAL post-beta, freemium tiers, B2B), user growth strategy (SEO, referrals, social, UWV/ROC partners, ASO, community), and KPIs (500 MAU / 5% conversion / first €500 MRR)

## 2026-06-28 (LLM job search + Dahl UX fixes)
- feat: backend/app/services/llm_job_search.py (new) — Claude + Tavily web search API as primary job search path; HTML scrapers (Jobbird, NVB, LinkedIn, Indeed) promoted to fallback when LLM returns < 5 results
- feat: match_reason field added to JobOut schema (transient, not stored in DB) — populated by LLM search, shown as italic blue text on job cards
- feat: fold-out job description on job cards — "Meer/Minder" toggle expands/collapses full description inline
- feat: job age warning on cards older than 21 days — orange label warns user vacancy may be expired
- feat: hours per week changed from free-text number to range dropdown (Max 16u, 16-24u, 24-32u, 32-36u, 40u fulltime)
- fix: apply all HOOG/MIDDEL UX findings from Dahl user test — search input focus, cancel button on letter modal, loading copy, empty state CTA, micro-copy corrections
- deps: tavily-python==0.5.0 added to requirements.txt
- config: TAVILY_API_KEY added to backend/app/config.py (empty string default; must be set in Railway env)

## 2026-06-25 (UX polish — blog, onboarding, job cards, settings)
- fix: blog/layout.tsx changed to pass-through; per-post layouts at blog/[slug]/layout.tsx fix prose wrapping and "Terug naar blog" navigation loop
- feat: onboarding step indicator "Stap X van 3" added to all wizard steps
- feat: credit cost warning shown on "Solliciteren" button before user confirms apply action
- feat: match % tooltip on job cards explains how the score is calculated
- fix: application status now correctly transitions from "pending" to "sent" for the "site" send method (backend/app/api/v1/apply.py)
- feat: profile completeness widget now lists specific missing fields instead of only a percentage
- fix: duplicate profile form removed from Settings page; replaced with a link to /dashboard/profiel
- ux: "Account verwijderen" danger zone in SettingsClient.tsx given red border and background for clearer visual warning

## 2026-06-25 (PR #121 — NL-only vacatures + dashboard keyword datalist)
- fix: LinkedIn scraper passes geoId=105756473 (Netherlands) to guest jobs API — restricts results to NL-posted vacancies at source (backend/app/services/job_scraper.py)
- fix: post-filter in jobs.py strips non-NL results after aggregation using location_country field — catches any international jobs that slip through from any scraper before DB upsert
- feat: datalist suggestions added to keywords search input on dashboard — native HTML autocomplete for common Dutch job titles, no external calls or cookies (DashboardClient.tsx)

## 2026-06-24 (PR #120 — remove all em dashes)
- fix: removed every em dash (U+2014) from 28 web source files — replaced with hyphens, colons, pipes, or restructured sentences; covers page titles, visible UI copy, and code comments

## 2026-06-24 (PR #119 — open registration CTA)
- feat: replaced waitlist form on homepage with direct account creation CTA — product is live and registration is open

## 2026-06-24 (PR #118 — invite landing page tone)
- fix: rewrote /invite/[code] landing page with welcoming, personal tone; new headline "Fijn dat je er bent."; steps focus on user benefit

## 2026-06-24 (PR #117 — invite page copy)
- fix: removed em dashes and "geen creditcard nodig" line from /invite/[code] page

## 2026-06-24 (PR #116 — invite landing page)
- feat: new /invite/[code] landing page — explains what Opstap is, 4-step how-it-works flow, CTAs pre-filled with invite code; noindex so it does not pollute search results

## 2026-06-24 (PR #115 — onboarding UX)
- feat: required job title field in onboarding welkom step 1 so auto-search always fires on first dashboard visit
- feat: added pulse skeleton for the searching state in DashboardClient
- fix: asterisk legend added to welkom form for required fields (dutch-copy review)

## 2026-06-24 (PR #113 — reactivation email blast)
- feat: send_reactivation() email function in email_sender.py — personalised Dutch re-engagement email to lapsed beta users
- feat: POST /admin/blast/reactivation in admin.py — sends reactivation email to all users who have not logged in for 14+ days; admin-key guarded
- feat: AdminPanel reactivation button — triggers the blast endpoint from the /admin UI; shows success/failure count

## 2026-06-24 (PR #112 — Google Search Console verification)
- ops: Google Search Console meta tag added to web/src/app/layout.tsx — opstapapp.nl now verified in GSC
- ops: sitemap.xml submitted to GSC for opstapapp.nl — pages indexed

## 2026-06-24 (feat/qa-form-002-execution)
- feat: WhatsApp referral share button + "Kopieer bericht" in ReferralSection.tsx — pre-composed Dutch invitation message, opens wa.me deeplink or copies to clipboard (Q20)
- feat: CookieBanner.tsx (new) — GDPR/AVG cookie consent banner with PostHog opt-in/opt-out; consent stored in localStorage; required because PostHog uses cookies (Q7)
- feat: layout.tsx — replaced Plausible analytics snippet with PostHog EU snippet (project 208801, eu.i.posthog.com); starts opted-out, reads localStorage consent on mount
- fix: DashboardClient.tsx — trackEvent calls migrated from plausible() to posthog.capture()
- security: next.config.ts CSP updated — eu-assets.i.posthog.com and eu.i.posthog.com added to connect-src and script-src for PostHog EU
- ops: NEXT_PUBLIC_POSTHOG_KEY set in Vercel env vars (PostHog EU project 208801)
- feat: job_scraper.py — scrape_jobbird() and scrape_nationale_vacaturebank() added as primary user-facing scrapers; scrape_adzuna() demoted to admin digest only (Q13)
- refactor: jobs.py — asyncio.gather() updated to use scrape_jobbird + scrape_nationale_vacaturebank; adzuna removed from user search path
- feat: web/src/app/dashboard/credits/page.tsx (new) — "Credits kopen — binnenkort beschikbaar" placeholder page; prevents 404 on /dashboard/credits route (Q15)

## 2026-06-23 (AVG data export — Art. 20 data portability)
- feat: GET /profile/export endpoint in backend/app/api/v1/profile.py — returns profile, applications (with letter_nl), saved_jobs, credit_transactions, referral_uses as JSON download; AVG Art. 20 right to data portability
- security: per-user 60s cooldown rate limit on /profile/export (in-process dict); .limit(500) on each Supabase query to bound response size
- fix: use Response + json.dumps(default=str) instead of JSONResponse — avoids FastAPI datetime serialisation TypeError on nested datetime objects
- feat: api.profile.exportData() in web/src/lib/api.ts — returns Blob for browser download trigger
- feat: "Jouw gegevens" section above danger zone in SettingsClient.tsx — "Download mijn gegevens" button with description of included data (profiel, sollicitaties, opgeslagen vacatures, credits, referrals)

## 2026-06-23 (PR #106 — sollicitaties letter toggle + heading rename)
- feat: "Bekijk brief" / "Verberg brief" inline toggle on each application card in sollicitaties/page.tsx — expands letter_nl without a modal; letter text loaded with the list response (no extra request) (#106)
- ux: page heading on sollicitaties page renamed "Jouw reacties" → "Jouw sollicitaties" — clearer label, matches nav item wording (#106)
- docs: LinkedIn NL scraper IP limitation note added to wiki — cloud/data-center IPs blocked by LinkedIn; scraper returns [] gracefully; residential proxy needed post-beta (#106)

## 2026-06-23 (LinkedIn NL scraper + schema hardening)
- feat: scrape_linkedin_nl() added to job_scraper.py — LinkedIn guest jobs API, no auth, up to 5 results, graceful 429 handling
- security: URL injection guard in scrape_linkedin_nl — only /jobs/view/ paths accepted; canonical URL reconstructed from path only, discarding raw API response URL
- feat: scrape_linkedin_nl added to asyncio.gather() in jobs.py alongside Adzuna and Indeed; linkedin_limit = min(params.limit // 3, 5)
- security: contract_type in JobSearchParams hardened from Optional[str] to Optional[Literal["Vast","Tijdelijk","Fulltime","Parttime"]] — rejects unknown values at schema level

## 2026-06-23 (QA — deliverability)
- qa: mail-tester.com score 9/10 — "Wow! Perfect, you can send". DKIM ✓, SPF ✓, not blocklisted, no broken links. -1 from RCVD_IN_BL_SPAMCOP_NET (SendGrid shared IP on SpamCop list — infrastructure issue, fix = dedicated IP on SendGrid paid plan). DMARC record not yet set for opstapapp.nl (no impact on current score but flagged; add `v=DMARC1; p=none` TXT record at `_dmarc.opstapapp.nl` to resolve).

## 2026-06-23 (QA — E2E apply flow fix)
- fix: SENDGRID_FROM_EMAIL corrected from sollicitaties@opstap.nl → sollicitaties@opstapapp.nl in Railway env vars — opstap.nl was not authenticated in SendGrid so all application emails silently failed; opstapapp.nl is the verified domain (SendGrid domain auth: em5548.opstapapp.nl)
- qa: E2E apply flow confirmed end-to-end: approve endpoint returns status "sent", email delivered to Gmail from sollicitaties@opstapapp.nl with correct Dutch motivation letter
- qa: AVG delete flow confirmed: DELETE /profile/me wipes profile row, auth user, and CV from Supabase Storage in one call
- qa: Admin panel confirmed: user list, PATCH suspend/unsuspend, POST credits adjust all working after PR #103 fixes

## 2026-06-20 (PR #103 — admin/apply hardening)
- fix: grant_credits RPC param corrected p_reference_id → p_reference in admin.py and apply.py — calls were silently failing with wrong param name (#103)
- fix: replace calls to non-existent adjust_credits RPC with correct grant_credits RPC throughout admin and apply modules (#103)
- fix: CreditAdjust Pydantic model — reason max_length=200, delta bounded ±10000 to prevent unbounded credit adjustments (#103)
- fix: toggle_suspend — existence check before write; returns 404 instead of 500 for unknown user (#103)
- fix: _fetch_job_page SSRF — IP-range validation now applied on every redirect hop, not just the first request (#103)

## 2026-06-18 (post-beta-credits)
- ops: daily-credits cron added to cron-job.org — POST /admin/cron/daily-credits, daily at 06:00 Amsterdam time (Europe/Amsterdam), x-admin-key header, idempotent (cap 15 credits/user)
- fix: CSP connect-src in web/next.config.ts — added https://opstapapp-production.up.railway.app so the frontend can reach the Railway backend without CSP violations (#94)
- fix: remove Outlook/Meta login buttons and Overslaan link from login page (#93)
- fix: bulk apply 404 + URL-letter dead end (#92)

## 2026-06-18 (beta-credits)
- feat: POST /admin/cron/daily-credits — grants +2 credits to all users with balance < 15; safe to re-run; intended for daily cron-job.org schedule (backend/app/api/v1/admin.py)
- refactor: removed POST /credits/purchase and POST /credits/webhook endpoints from credits.py — Mollie iDEAL deferred to post-beta
- refactor: removed PurchaseRequest and PurchaseOut Pydantic models from schemas/credits.py
- feat: BuyCreditsModal.tsx — replaced iDEAL payment UI with beta info panel explaining +2 free credits/day, max 15 (web/src/app/dashboard/components/BuyCreditsModal.tsx)
- fix: betaling/terug/page.tsx — now redirects to /dashboard instead of Mollie return flow (web/src/app/dashboard/betaling/terug/page.tsx)
- refactor: api.credits.purchase removed from web/src/lib/api.ts

## 2026-06-18 (search-quality)
- feat: _dedup_by_company() helper in jobs.py — caps results at max 2 per company across DB cache, stale fallback, and live scraper return paths (backend/app/api/v1/jobs.py)
- feat: global IP rate limiter as FastAPI middleware — sliding window 200 req/60s per IP, in-process deque store, prunes stale keys, excludes OPTIONS, Dutch 429 message (backend/app/main.py)

## 2026-06-18 (cv-polish)
- feat: profile.py — `_attach_cv_url` pops `cv_structured` from the response dict and adds `cv_parsed: bool`; raw CV JSONB is never sent to the frontend (backend/app/api/v1/profile.py)
- feat: api.ts — Profile interface extended with `cv_parsed?: boolean` (web/src/lib/api.ts)
- feat: profiel/page.tsx — CV status card shows "gegevens verwerkt ✓" when cv_parsed is true (web/src/app/dashboard/profiel/page.tsx)

## 2026-06-18 (retention-v2)
- feat: DashboardClient.tsx — triggerSearch auto-retries without location when results < 3 (widens search instead of "geen resultaten")
- feat: welkom/page.tsx — Plausible custom events on onboarding profile save, CV upload, CV skip, and onboarding completion
- feat: ReferralSection.tsx — shows referral invite count vs beta cap ("Jij hebt X van 5 uitnodigingen gebruikt")

## 2026-06-18 (activation-retention)
- feat: handleGenerateLetter accepts optional profileOverride param — fixes race condition in pending-apply flow (DashboardClient.tsx)
- feat: profile completeness nudge banner shown on dashboard when no CV uploaded (DashboardClient.tsx)
- feat: referral card shown after successful application using profile.referral_code (DashboardClient.tsx)
- fix: mobile letter modal overflow — max-h-[90vh] overflow-y-auto, items-end on small screens, textarea rows 10 → 7 (DashboardClient.tsx)

## 2026-06-18 (beta roadmap — 20 items)
- feat: GET /apply/stats endpoint — per-user application counts by status (apply.py)
- feat: GET /admin/stats endpoint — platform-wide user + application aggregates (apply.py)
- feat: removed /apply/send bypass — all applications now route through approval gate only
- feat: send_interview_congratulations() + send_cv_expiry_warning() email functions (email_sender.py)
- feat: SendGrid retry with exponential backoff in approve_and_send (3 attempts, 1/2/4 s delays)
- feat: location normalisation in jobs.py — city names standardised before DB insert
- feat: X-Jobs-Source: cache response header on job search — indicates whether result is from DB cache or live scrape
- feat: migration 011 — invite_codes.source column + profiles.confirmed_at timestamp
- feat: sollicitaties/page.tsx — stats tiles (total/sent/interview/rejected), interview badge, empty state CTA, retry button for failed applications
- feat: DashboardClient.tsx — regen remaining count, stale cache banner (reads X-Jobs-Source header), Plausible custom events on key actions
- feat: DashboardClient.tsx — pending apply from saved jobs (triggers apply flow directly from saved job list)
- feat: opgeslagen/page.tsx — Solliciteren button for applying directly from saved jobs page
- feat: ReferralSection.tsx — credits earned from referrals now displayed to user
- feat: api.ts — stats(), retry(applicationId), searchWithStale() helpers added

## 2026-06-18
- fix: invite redemption now atomic via Supabase RPC (use_count increment in single transaction, prevents double-redemption race) — backend/app/api/invite.py, migration 010
- fix: rate limits added to all public + protected invite endpoints (30/min per IP on validate/register, 5/min on admin create)
- fix: silent exception swallow removed from invite endpoint — errors now propagate correctly
- fix: PII (email, name) removed from invite code logs and admin notes
- fix: invite code no longer returned in validate response (was leaking the raw code back to the caller)
- fix: invite_waitlist_entry TOCTOU — check-then-insert replaced with upsert to eliminate race condition
- fix: empty-key guard added to _check_admin_key — rejects blank strings that would previously pass
- fix: AVG consent bullet in welkom/page.tsx — accurate description of Anthropic API data processing, removed trailing period for bullet list consistency
- fix: AVG consent Anthropic disclosure in profiel/page.tsx (from previous session, now consistent across all consent surfaces)
- fix: homepage fabricated stats replaced with honest qualitative benefits section
- fix: WaitlistForm.tsx copy — "Geen spam." (removed "geen verplichtingen" which was unverifiable)
- feat: migration 010_invite_redeem_rpc.sql — atomic use_count RPC for invite redemption

## 2026-06-17 (shared jobs pool)
- feat: shared jobs pool — dropped scraped_for_user column, added PostgreSQL FTS (tsvector + GIN index, dutch dictionary), DB-first 6h cache in search_jobs, pg_cron stale-job cleanup (48h TTL)
- feat: admin prefetch-jobs cron endpoint (POST /admin/prefetch-jobs) — warms 20 popular NL searches daily at 06:00 via cron-job.org
- feat: letter quality feedback — thumbs-up/down on sent applications, stored in applications.letter_feedback (#77)
- feat: auto-load matching jobs when dashboard opens if profile has job title set (#78)
- feat: confirmation email on apply, auto-search after onboarding completes (#79)

## 2026-06-17 (infra)
- ops: 5 cron jobs configured on cron-job.org — warn-cv-expiry (daily 02:00), cleanup-expired-cvs (daily 03:00), follow-up reminder (Sundays 09:00), job-digest (Mondays 09:00), purge-inactive (monthly)
- ops: Vercel env vars confirmed complete — ADMIN_API_KEY, NEXT_PUBLIC_TURNSTILE_SITE_KEY, TURNSTILE_SECRET_KEY, NEXT_PUBLIC_PLAUSIBLE_DOMAIN all set on opstap-app project
- ops: Plausible account activated — opstapapp.nl registered, 1 visitor tracked, 25 trial days remaining

## 2026-06-17
- fix: SSRF HIGH x2 — /apply/from-url now resolves hostname to IP, blocks private/loopback ranges, disables redirect-following with re-validation of redirect targets (apply.py)
- fix: route shadowing MEDIUM — GET /jobs/saved/list declared before /{job_id} in jobs.py
- fix: credit race condition MEDIUM — /apply/from-url uses atomic debit_one_credit RPC before fetch+generation
- fix: unbounded job_data MEDIUM — SavedJobData Pydantic model replaces bare dict on POST /jobs/saved
- fix: writing_style injection MEDIUM — UrlLetterRequest.writing_style uses _WritingStyle Literal type
- fix: PromptInjectionError LOW — no credit refund on injection, returns 422 instead of 500
- fix: Indeed href injection MEDIUM — only /vacatures/, /rc/ etc. URL prefixes accepted in scrape_indeed_nl
- feat: Indeed NL HTML scraper (BeautifulSoup) added alongside Adzuna; double Adzuna call removed — now single scrape_adzuna + scrape_indeed_nl in parallel (job_scraper.py, jobs.py)
- feat: saved jobs persist to Supabase (saved_jobs table) — GET /saved/list, POST /saved, DELETE /saved/{job_id}; localStorage kept as fast local cache (DashboardClient.tsx, api.ts)
- feat: sollicitaties status dropdown (sent/pending/replied/accepted/rejected) replaces "markeer als beantwoord" button (sollicitaties/page.tsx)
- feat: POST /apply/from-url — fetch job posting URL, extract title/company/description, generate motivation letter for 1 credit; SSRF-protected (http/https + netloc required) (apply.py)
- feat: URL-to-letter collapsible UI below search bar with copy button (DashboardClient.tsx)
- feat: beschikbaarheid (availability) select field (fulltime/parttime/both) added to /dashboard/profiel and profile creation form (d30f7a6)
- fix: make all SendGrid calls non-blocking with run_in_executor in email_sender.py and email_notifications.py (3e59998)
- fix: dashboard profile form — 3 job titles, salary range, 409 fallback (#71)
- feat: salary range (min/max bruto/maand) added to profile page (#70)
- feat: email users when admin adjusts credits or suspends account (#69)
- fix: remove EU-server location claims from AVG modals and privacy page (#68)

## 2026-06-16
- fix: sidebar 'Aan de slag' border fix + language switcher added to desktop sidebar (#62 / 22dcdd3)
- feat: link to cvmaker.nl on profile page for users without a CV (#61 / c2c7d9a)
- ops: SendGrid domain verification completed for opstapapp.nl (DKIM/SPF records confirmed)
- fix: remove privacy link from sidebar — footer-only placement
- feat: Outlook and Meta OAuth buttons greyed out with "binnenkort beschikbaar" label
- feat: language switcher added to public pages and dashboard (NL active; EN/AR/TR/UK coming soon)
- feat: profile page — "Over jezelf" (extra_info) textarea added
- feat: profile page — Leeftijd (age) field and brief_taal (letter language NL/EN) select added
- feat: DB migration — leeftijd, brief_taal, cv_expiry_reminder_enabled columns added to profiles table
- feat: settings — CV expiry reminder toggle added to email preferences
- fix: AVG consent modal — removed specific server location "(Frankfurt)"
- fix: privacy page — removed specific server location, replaced with "contact us" approach

## 2026-06-13
- fix: remove middleware.ts — conflicts with Next.js 16 proxy.ts convention; session refresh already handled by proxy.ts (#59 / 56a48f8)
- fix: simplify application email footer, update domain to opstapapp.nl (#59 / aba826b)
- feat: CV upload on profile page with AVG consent modal (#58 / d153ee7)
- fix: restore middleware so Supabase session is refreshed on every request (#57 / e80e5ff)
- fix: Plausible analytics env-var driven domain (#56 / 85bba7c)
- ops: Vercel project Root Directory corrected to web/, Framework Preset set to Next.js — site was down
- ops: missing Vercel env vars added (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_API_URL)
- ops: Cloudflare Email Routing catch-all set up for @opstapapp.nl → Gmail + label created

## 2026-06-12
- fix: drive Plausible analytics domain from NEXT_PUBLIC_PLAUSIBLE_DOMAIN env var (was hardcoded)
- fix: auto-detect host for auth email redirect URLs (#55)
- fix: move legal/AVG copy to small footer section on over-ons page (#54)
- feat: add /privacy page with full AVG-compliant Dutch privacy policy (#53)
- chore: consolidate all docs into docs/ folder, add wiki (#52)
- chore: add updater agent, pre-push hook, changelog, fix schoolverlaters copy (#51)
- fix: update Daan testimonial to career-change-from-unhappy-job story (#50)
- fix: fixed-position blobs and always-visible sidebar on public pages (#49)
- feat: organic hero blobs, fix sidebar sticky scroll regression (#48)
- feat: organic sidebar wave + decorative circles, Opstap email footer (#47)
- fix: remove duplicate /dashboard nav item causing React key warning (#46)
- feat: contact form type/subject dropdowns, remove exposed email addresses (#45)
- feat: replace Fatima testimonial with Roemer S. (TV bijrol via Opstap) (#44)
- feat: contact page, fix testimonials, remove em dashes, drop Voor werkgevers section (#43)
- fix: change CTA from 'Gratis beginnen' to 'Begin nu' (#42)
- fix: remove pricing from homepage, show it only after credits run out (#41)
- docs: convert PLANNING/ROADMAP/GUIDE from MD to styled HTML
- feat: add stats, testimonials and company contact to home page (#40)
- feat: add mobile hamburger menu to public pages (#39)
- fix: keep mobile header pinned when scrolling (#38)
- fix: remove skip button from profile creation form (#37)
- feat: multi-apply, onboarding wizard, email apply (#36)
- feat: saved jobs, credit history, email prefs, profile completion (#35)
- fix: permanently delete middleware.ts (deprecated in Next.js 16, replaced by proxy.ts) (#34)
- feat: purchase rate limiting, monthly credits cron, pricing section (#33)
- fix: move admin guard to proxy.ts, delete deprecated middleware.ts (#32)
- feat: admin panel — user list, credits, suspend, delete (#31)
- feat: email notifications, hourly salary, manual reply logging (#30)
- feat: credits system, Mollie iDEAL payments, and referral program (#29)
