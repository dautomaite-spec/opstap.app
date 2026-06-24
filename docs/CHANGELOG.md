# Changelog — Opstap

## 2026-06-24
- feat: scrape_nvb(), scrape_jobbird(), scrape_monsterboard(), scrape_werkzoeken() added to job_scraper.py; asyncio.gather updated to 7 scrapers in jobs.py — full NL board coverage
- feat: send_admin_signup_notification() in email_notifications.py; fire-and-forget call in profile.py on new user signup
- feat: referral cap raised from 5 to 10 in ReferralSection.tsx
- feat: "Probleem melden" bug-report button added to DashboardShell.tsx; nav label fix
- refactor: trackEvent switched from Plausible to PostHog in DashboardClient.tsx and welkom/page.tsx; PostHog init added to layout.tsx; CSP updated in next.config.ts for PostHog domains
- ops: Cloudflare DNS — _dmarc.opstapapp.nl TXT record added (DMARC v=DMARC1; p=none) — resolves mail-tester.com DMARC warning from 2026-06-23 QA
- ops: SendGrid opstap-backend API key scope reduced from Full Access to Mail Send only
- qa: QA Form 002 published (qa-form.html replaced); Form 001 archived to qa-archive/qa-form-001-2026-06-24.html

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
