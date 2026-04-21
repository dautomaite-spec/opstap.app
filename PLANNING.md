# Opstap — Planning Document
> Last updated: 2026-04-21 (Phase 3 in progress — infrastructure live, store assets next)

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
- [ ] Screenshots for Play Store (5× portrait, Pixel 6)
- [x] CORS_ORIGINS set on Railway (localhost, opstap.nl, www.opstap.nl, Railway URL)
- [ ] E2E test: register → upload CV → search → letter → apply
- [ ] Play Store submission
- [ ] Apple App Store submission
- [ ] v2 planning
