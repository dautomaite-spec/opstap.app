# Opstap — Planning Document
> Last updated: 2026-06-05 (Strategic pivot: website first, app store deferred until traction milestone)

---

## 0. Strategy — Website First

**Decision (2026-06-05):** Launch a web product before submitting to any app store.

**Rationale:**
- Faster iteration cycle — no review queue, deploy instantly
- Validate demand and collect real users before investing in store listings
- A live domain with real visitors strengthens Play Store / App Store submissions
- SEO + content marketing possible on web, not possible in apps

**App store milestone:**
> Submit to Google Play and Apple App Store once the website reaches **500 unique monthly active users** (logged-in, completed at least one job search).

**Current focus order:**
1. ✅ Website — Next.js, deployed to Vercel, domain opstap.nl (or opstap.app)
2. ⏳ Traction — 500 MAU milestone
3. ⏸ Play Store submission — deferred
4. ⏸ Apple App Store submission — deferred

---

## 1. App Overview

**Name:** Opstap
**Platforms:** Android (Google Play) + iOS (App Store)
**Primary market:** Netherlands (v1), expandable
**Language:** Dutch (v1), multi-language (v2)
**Monetization:** Freemium + ads (v2)
**Framework:** Flutter (iOS + Android from one codebase)
**Backend:** Python FastAPI — cloud hosted
**AI:** Claude API (Anthropic)
**Database:** PostgreSQL via Supabase (EU region)
**Auth/Storage:** Supabase

---

## 2. Target Users

| | |
|---|---|
| **Who** | Active & passive job seekers |
| **Age** | 15–45 primary, all ages supported |
| **Background** | Blue collar + white collar |
| **Region** | Netherlands (v1) |

---

## 3. MVP Scope (v1 vs v2)

| Feature | v1 | v2 |
|---|---|---|
| Resume upload | ✅ | ✅ |
| Manual profile setup | ✅ | ✅ |
| Job search — NL boards | ✅ | ✅ |
| Auto-apply (email + form) | ✅ | ✅ |
| AI motivation letter (Dutch) | ✅ | ✅ |
| AVG/GDPR consent flow | ✅ | ✅ |
| Resume builder (LLM) | — | ✅ |
| Auto-extract CV profile | — | ✅ |
| Dashboard / tracker | — | ✅ |
| Multi-language | — | ✅ |
| Ads + freemium system | — | ✅ |
| Expand beyond NL | — | ✅ |
| Paste any job URL → AI letter | — | ✅ |

---

## 4. Adaptive User Flow

Every step is optional. The user can stop, skip, or go fully automatic.

```
┌─────────────────────────────────────────────────────────┐
│                     OPSTAP — v1 FLOW                    │
└─────────────────────────────────────────────────────────┘

START
  │
  ▼
┌─────────────────────────────────────┐
│           ONBOARDING                │
│  - Welcome screen                   │
│  - Language select (Dutch default)  │
│  - AVG consent                      │
│  - Account create / login           │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│     "How do you want to start?"     │
│                                     │
│  [A] Upload my resume               │
│  [B] Enter my info manually         │
└──────┬──────────────────┬───────────┘
       │                  │
       ▼                  ▼
┌─────────────┐    ┌─────────────────┐
│ AVG NOTICE  │    │  MANUAL FORM    │
│ shown first │    │  Name           │
│             │    │  Location       │
│ Upload CV   │    │  Job type       │
│ PDF / DOCX  │    │  Availability   │
│             │    │  Salary range   │
└──────┬──────┘    └────────┬────────┘
       │                    │
       ▼                    │
┌─────────────┐             │
│  EXTRACTED  │             │
│  PROFILE    │             │
│  (editable) │             │
└──────┬──────┘             │
       │                    │
       └────────┬───────────┘
                │
                ▼
┌─────────────────────────────────────┐
│         PROFILE CONFIRMED           │
│  User reviews preferences           │
│  Sets: job type, location,          │
│  hours, salary, keywords            │
│                          [optional] │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│           JOB SEARCH                │
│  Scrapes NL job boards:             │
│  - Indeed NL                        │
│  - LinkedIn NL                      │
│  - Jobbird                          │
│  - Nationale Vacaturebank           │
│                                     │
│  AI matches jobs to profile         │
│  Shows: title, company,             │
│  location, match score              │
│                          [optional] │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│         REVIEW JOBS                 │
│  User selects jobs to apply to      │
│  OR sets auto-select threshold      │
│                          [optional] │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│           AUTO-APPLY                │
│  AI generates motivation letter     │
│  tailored per job (in Dutch)        │
│                                     │
│  User reviews letter (optional)     │
│  OR sends automatically             │
│                                     │
│  Method: email or web form          │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│         CONFIRMATION                │
│  "X applications sent"              │
│  Summary shown to user              │
└─────────────────────────────────────┘
```

---

## 5. Screen Map

```
Opstap App
│
├── Onboarding (first launch only)
│   ├── Welcome
│   ├── Language select
│   ├── AVG consent
│   └── Login / Register
│
├── Home
│   └── Quick start + status overview
│
├── Profiel (Profile)
│   ├── CV upload
│   ├── Manual entry form
│   └── Edit profile
│
├── Zoeken (Search)
│   ├── Search settings
│   ├── Job results list
│   └── Job detail view
│
├── Solliciteren (Apply)
│   ├── Selected jobs
│   ├── Generated motivation letter (preview)
│   └── Send confirmation
│
└── Instellingen (Settings)
    ├── Account
    ├── Privacy & data (delete account)
    └── About / version
```

---

## 6. Data Flow

```
[User] → uploads CV or fills form
  ↓
[Supabase Storage] → CV stored encrypted (EU region)
  ↓
[FastAPI Backend] → extracts / processes profile
  ↓
[Claude API] → parses CV, generates profile fields
  ↓
[PostgreSQL] → stores user profile (no raw CV in DB)
  ↓
[FastAPI Backend] → scrapes NL job boards
  ↓
[Claude API] → matches jobs to profile, scores them
  ↓
[FastAPI Backend] → generates motivation letter per job
  ↓
[FastAPI Backend] → sends application (email / form fill)
  ↓
[PostgreSQL] → logs application record
  ↓
[Flutter App] → shows confirmation to user
```

---

## 7. Tech Stack

| Layer | Tool | Purpose |
|---|---|---|
| Mobile app | Flutter 3.x | iOS + Android |
| State management | Riverpod | Clean, scalable state |
| Backend API | Python FastAPI | Core logic, scraping, LLM calls |
| AI | Claude API (claude-sonnet-4-6) | CV parsing, job matching, letter generation |
| Job scraping | Playwright + job board APIs | Scrape Indeed NL, Jobbird, NVB |
| Database | PostgreSQL (Supabase) | Users, jobs, applications |
| Auth | Supabase Auth | Login, sessions |
| File storage | Supabase Storage (EU) | CV files, encrypted |
| Hosting | Cloud (EU region) | AVG compliant |
| i18n | Flutter intl | Multi-language ready from day 1 |

---

## 8. AVG / GDPR Rules (built into v1)

1. Explicit consent screen before any CV upload
2. EU servers only — no data leaves the EU
3. User can delete all their data at any time (Settings → Privacy)
4. CV storage model: Option C — stored encrypted for a user-defined period (default 30 days)
   - User sets their own expiry period on upload (7 / 30 / 90 days)
   - Warning email sent 7 days before expiry
   - CV auto-deleted on expiry unless user extends
   - User can manually delete at any time via Settings
   - Clear notice shown before upload explaining exactly this
5. No CV data used for model training or shared with third parties
   - Exception: Claude API processes CV for extraction (disclosed to user)
6. Retention policy: account data auto-deleted after 90 days of inactivity (with 30-day warning)
7. Privacy policy shown in-app (plain Dutch, no legal jargon)
8. Every automated decision (job match, letter) is visible and editable
9. Right to data export — user can download all their data from Settings
10. Every application sent is logged and visible to the user

---

## 9. Competitive Position

| | Opstap | LazyApply | Jobbird | LinkedIn |
|---|---|---|---|---|
| Dutch job boards | ✅ | ❌ | ✅ | Partial |
| AI motivation letter (NL) | ✅ | ❌ | ❌ | ❌ |
| Auto-apply | ✅ | ✅ | ❌ | Partial |
| AVG compliant | ✅ | ❌ | ✅ | Partial |
| All-in-one pipeline | ✅ | ❌ | ❌ | ❌ |

---

## 10. Build Phases

### Phase 1 — Planning (current)
- [x] Define target users & MVP scope
- [x] Competitive analysis
- [x] Visual workflow & planning
- [ ] Decide on tools & platforms
- [ ] Data model design
- [ ] User flows & journeys
- [ ] Wireframes
- [ ] AVG/GDPR rules
- [ ] Dev rules

### Phase 2 — Building (next)
- [x] Backend setup (FastAPI + Supabase)
- [x] Flutter project scaffold
- [x] Auth flow (Login + Register screens, Supabase auth, go_router guards)
- [x] CV upload + profile extraction (file_picker, retention selector, ApiClient)
- [x] Job scraping (Jobbird RSS + Nationale Vacaturebank RSS)
- [x] Motivation letter generation (Claude API, Dutch prompt, banned-phrases list)
- [x] Auto-apply (SendGrid email, Reply-To pattern)
- [x] Basic UI — all 10 screens wired to real API + Riverpod providers
- [x] Settings screen (account, privacy/data deletion, notifications, about)

### Phase 3 — Polish & Launch
- [x] Railway backend deployed — https://opstapapp-production.up.railway.app (/health ✅)
- [x] Supabase migration 004 applied (writing_style + cv_expires_at columns)
- [x] 4 Supabase Edge Functions deployed and ACTIVE (delete-account, warn-cv-expiry, cleanup-expired-cvs, purge-inactive)
- [x] Supabase OAuth redirect URLs configured (7 URLs: localhost, opstap://, opstap.nl, Railway)
- [x] Flutter `opstap/` web build wired to production backend
- [x] ApplicationsScreen + MainShell + router `/app` route created
- [x] Play Store listing copy written (Dutch) — cowork/04_play_store_copy.md
- [x] Privacy policy written (AVG-compliant Dutch) — cowork/05_privacy_policy_nl.md
- [x] App icon (512×512) — Canva, exported PNG
- [x] Feature graphic (1024×500) — Canva, slogan "Meer kansen. Minder moeite."
- [x] Screenshots for Play Store (5× portrait, Pixel 6) — store_01–05.png
- [x] CORS_ORIGINS + CORS_ORIGIN_REGEX set on Railway (any localhost port + production URLs)
- [x] E2E test: register → login → profile → job search → letter → apply ✅ (all steps pass)
- [ ] Domain registered (opstap.nl preferred)
- [x] Website deployed to Vercel (https://opstap-app-j5ie.vercel.app)
- [x] Next.js project scaffolded in `web/`
- [x] Opstap color palette + Tailwind v4 configured
- [x] Supabase auth wired (SSR, cookie-based)
- [x] Railway API client typed
- [x] Landing page built
- [x] Login page (`/login`)
- [x] Register page (`/register`)
- [x] Dashboard (`/dashboard`) — job search + apply + history
- [x] Settings / profile page (`/dashboard/settings`)
- [x] Privacy policy page (`/privacy`)
- [x] OG image + social meta tags
- [x] SEO foundations: sitemap.xml, robots.txt, JSON-LD structured data, canonical URLs
- [x] E2E test suite (Playwright, 10/10 passing) + GitHub Actions CI
- [x] Deployed to Vercel (https://opstap-app-j5ie.vercel.app)
- [x] Blog (3 articles, MDX pipeline, SEO)
- [x] Auth email confirmation flow (/auth/confirm callback + /register/bevestig page)
- [x] Password reset flow (/forgot-password + /auth/reset callback + /reset-password)
- [x] AVG consent modal before CV upload (retention selector, purpose statement)
- [x] Writing style selector in motivation letter modal (formeel/informeel/enthousiast)
- [x] Send method picker in apply modal (e-mail vs webformulier)
- [x] /misbruik abuse reporting page
- [x] /voorwaarden terms of service page
- [x] error.tsx global error boundary + not-found.tsx 404 page
- [x] Footer legal links (Privacyvoorwaarden, Voorwaarden, Misbruik melden)
- [x] Migration 005 applied (last_active_at, avg_consent_given_at columns)
- [x] Security fixes: HTML strip on letter_nl, contact_email validation, suspension check ordering
- [x] Email sender returns False when SENDGRID_API_KEY not set (was incorrectly returning True)
- [x] Supabase redirect URLs: /auth/confirm and /auth/reset added

### Traction milestone — 500 MAU
> Unlock Play Store + App Store submissions once 500 unique monthly active users have completed at least one job search on the website.

- [x] Analytics wired (Plausible — cookieless, GDPR-safe, domain pending)
- [ ] Domain registered (opstap.nl) — manual, SIDN registrar
- [ ] Plausible account activated (requires domain first)
- [ ] 500 MAU reached → trigger app store submissions

### Phase 4 — App Store (deferred)
- [ ] Play Store submission
- [ ] Apple App Store submission
- [ ] v2 planning
