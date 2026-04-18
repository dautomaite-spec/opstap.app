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
  ✅  Job scraping (Jobbird + Nationale Vacaturebank RSS)
  ✅  AI motivation letter (Claude API, Dutch, 4 writing styles)
  ✅  Auto-apply via email (SendGrid, Reply-To pattern)
  ✅  All 10 screens wired to live API
  ✅  Settings screen (account, data deletion, privacy)
  ✅  LLM rate limiting (5/job, 10/day letters · 20/day applications)
  ✅  Security hardening (path traversal, MIME, prompt injection, CORS)
  ✅  Project agents (stylist, avg-checker, dutch-copy, security)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  PHASE 3 — DEPLOY & LAUNCH                              📍 HERE NOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ✅  Supabase OAuth redirect URLs configured
  ✅  Deploy backend → Railway
  ✅  Add Railway URL to Supabase redirect list
  ✅  Update env.json → point Flutter at live backend
  ⏳  Supabase RLS verified in production            ← in progress
  ⬜  End-to-end test (register → upload → search → apply)
  ⬜  Privacy policy written + hosted at opstap.nl/privacy
  ⬜  Register opstap.nl domain
  ⬜  App icon (512×512)
  ⬜  Feature graphic (1024×500)
  ⬜  Screenshots (4–8, phone + tablet)
  ⬜  Play Store listing copy (NL) — short + full description
  ⬜  Google Play Console account ($25 one-time)
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
