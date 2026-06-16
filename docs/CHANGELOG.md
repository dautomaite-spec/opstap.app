# Changelog — Opstap

## 2026-06-17
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
