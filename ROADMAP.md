# Opstap — Roadmap
> Last updated: 2026-04-18

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  PHASE 1 — PLANNING                                          ✅ DONE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ✅  Define MVP scope & target users
  ✅  Competitive analysis
  ✅  User flow & screen map
  ✅  Tech stack decisions
  ✅  AVG/GDPR rules
  ✅  Style guide (indigo / yellow / lavender)
  ✅  Wireframes (Google Stitch)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  PHASE 2 — BUILDING                                          ✅ DONE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ✅  FastAPI backend + Supabase (DB, Auth, Storage)
  ✅  Flutter scaffold + Riverpod + go_router
  ✅  Auth — email/password + Google OAuth
  ✅  Forgot password flow
  ✅  CV upload (PDF/DOCX, AVG consent, retention selector)
  ✅  Manual profile setup
  ✅  Job scraping (Jobbird Playwright + Nationale Vacaturebank RSS)
  ✅  AI motivation letter (Claude API, Dutch, 4 writing styles)
  ✅  Auto-apply via email (SendGrid, Reply-To pattern)
  ✅  All 10 screens wired to live API
  ✅  Settings screen (account, data deletion, privacy)
  ✅  LLM rate limiting (5/job, 10/day letters · 20/day applications)
  ✅  Anti-spam guardrails (per-company weekly limit, abuse reporting, suspension)
  ✅  IP flood protection (sliding window, 10 req/60s)
  ✅  Security hardening (path traversal, MIME, prompt injection, CORS)
  ✅  Project agents (stylist, avg-checker, dutch-copy, security, developer)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  PHASE 3 — DEPLOY & LAUNCH                              📍 HERE NOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Backend — live on Railway (europe-west4, EU region)
  ✅  Supabase OAuth redirect URLs configured
  ✅  Backend deployed → Railway (europe-west4, Dockerfile)
  ✅  Railway URL added to Supabase redirect list
  ✅  env.json → Flutter pointed at live backend
  ✅  Supabase RLS verified in production (4 tables)
  ✅  Migration 003: abuse_reports + is_suspended + abuse_report_count
  ✅  ADMIN_API_KEY set in Railway variables
  ✅  E2E verified: auth ✅ · profile ✅ · job search ✅ · apply/send ✅
  ❌  Letter generation blocked — Anthropic account needs credits

  Pre-launch blockers
  ⬜  Add Anthropic credits (console.anthropic.com → Plans & Billing)
  ⬜  Add SendGrid API key to Railway variables (currently empty → emails fail)
  ⬜  Flutter app device testing — smoke test all 10 screens on Android
  ⬜  AVG consent screen verified end-to-end on device

  Store assets & submission
  ⬜  Register opstap.nl domain
  ⬜  Privacy policy written + hosted at opstap.nl/privacy
  ⬜  App icon (512×512 PNG)
  ⬜  Feature graphic (1024×500 PNG)
  ⬜  Screenshots (4–8, phone + 7-inch tablet)
  ⬜  Play Store listing copy (NL) — short description (80 chars) + full (4000)
  ⬜  Google Play Console account ($25 one-time fee)
  ⬜  Play Store submission — Android
  ⬜  App Store submission — iOS (optional, $99/yr)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  PHASE 4 — POST-LAUNCH (v1 stable)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ⬜  Monitor crash reports + user feedback
  ⬜  Switch letter model to Gemini 2.0 Flash (cost reduction)
  ⬜  Add Indeed NL + LinkedIn NL scrapers
  ⬜  Application tracker / dashboard
  ⬜  Push notifications (expiry warnings, apply confirmations)
  ⬜  AVG auto-delete job (90-day inactivity, CV expiry)
  ⬜  Freemium model — define limits for free vs paid tier


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  PHASE 5 — V2
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ⬜  Auto-extract profile from CV (Claude vision)
  ⬜  Resume builder (LLM-assisted)
  ⬜  Multi-language support (EN, DE, FR)
  ⬜  Ads + freemium system
  ⬜  Expand beyond NL job boards
  ⬜  Dashboard & application analytics


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  LEGEND
  ✅  Done    ⏳  In progress    ⬜  Not started    📍  Current phase

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
