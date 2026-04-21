# Opstap — Developer Guide

Dutch job application automation app. Users upload a CV or fill in a profile, search Dutch job boards, and send AI-generated motivation letters.

---

## Stack at a glance

| Layer | Technology |
|---|---|
| Mobile app | Flutter 3.x — iOS + Android |
| State management | Riverpod 2.x |
| Navigation | go_router 14.x |
| Backend API | Python FastAPI on Railway |
| AI (letter generation) | Anthropic Claude API (`claude-sonnet-4-6`) |
| Database + Auth | Supabase (EU — `eu-central-1`) |
| CV file storage | Supabase Storage, bucket `cvs` (private, 10 MB limit) |
| Email delivery | SendGrid |
| Job scraping | Playwright (Python) |
| Scheduled jobs | Supabase pg_cron + Edge Functions (Deno) |

---

## Repository layout

```
Opstap.App/
├── flutter_application_1/       # Flutter mobile app
│   └── lib/
│       ├── core/
│       │   ├── config.dart      # Supabase URL, anon key, backend URL, bucket name
│       │   ├── router.dart      # All routes + auth redirect guard
│       │   └── theme.dart       # Colours, typography (Manrope/Inter), button styles
│       ├── models/
│       │   ├── job.dart
│       │   ├── profile.dart
│       │   └── application.dart
│       ├── providers/
│       │   ├── auth_provider.dart      # Supabase auth, signOut, deleteAccount
│       │   ├── profile_provider.dart   # CRUD profile, deleteCv
│       │   └── jobs_provider.dart      # Job search, letter generation, selected job
│       ├── services/
│       │   └── api_client.dart         # HTTP calls to FastAPI backend
│       ├── screens/
│       │   ├── welcome_screen.dart
│       │   ├── auth/                   # login, register
│       │   ├── onboarding/             # avg_consent, cv_upload, profile_form, start
│       │   ├── jobs/                   # job_search, job_results, job_detail
│       │   ├── apply/                  # letter_preview, confirmation
│       │   ├── applications/           # applications list
│       │   ├── profile/                # profile view + CV card
│       │   ├── settings/               # settings, privacy sheet, delete flows
│       │   └── main_shell.dart         # BottomNavigationBar shell
│       └── widgets/
│           ├── opstap_button.dart      # PrimaryButton, SecondaryButton
│           └── job_card.dart
│
├── backend/
│   ├── app/
│   │   ├── main.py                     # FastAPI app, CORS, router mount
│   │   ├── core/
│   │   │   ├── auth.py                 # JWT → user_id dependency, touches last_active_at
│   │   │   ├── config.py               # pydantic-settings, reads env vars
│   │   │   ├── rate_limiter.py         # in-memory per-user + per-IP limits
│   │   │   └── supabase.py             # Supabase service-role client
│   │   ├── api/v1/
│   │   │   ├── apply.py                # POST /apply/letter, POST /apply/send, GET /apply/history
│   │   │   ├── jobs.py                 # POST /jobs/search
│   │   │   ├── profile.py              # GET/PUT /profile
│   │   │   ├── abuse.py                # POST /abuse/report
│   │   │   └── router.py               # mounts all sub-routers at /api/v1
│   │   ├── services/
│   │   │   ├── letter_generator.py     # Calls Anthropic, returns Dutch motivation letter
│   │   │   ├── job_scraper.py          # Playwright scraper for Dutch job boards
│   │   │   ├── email_sender.py         # SendGrid wrapper, header sanitization, HTML escaping
│   │   │   └── prompt_guard.py         # Injection detection before Claude calls
│   │   └── schemas/                    # Pydantic request/response models
│   ├── supabase/
│   │   ├── migrations/                 # 001–004 SQL migrations (run in order)
│   │   └── functions/
│   │       ├── delete-account/         # AVG Article 17 — full data deletion
│   │       ├── purge-inactive/         # AVG rule 6 — 90-day inactivity purge
│   │       ├── warn-cv-expiry/         # AVG rule 4 — 7-day expiry warning email
│   │       └── cleanup-expired-cvs/    # AVG rule 4 — delete Storage files on expiry
│   ├── Dockerfile
│   └── requirements.txt
│
└── cowork/                             # Copy-paste prompts for manual deploy steps
    ├── 01_railway_deploy.md
    ├── 02_supabase_oauth_redirects.md
    └── 03_supabase_edge_functions.md
```

---

## Running locally

### Flutter app

```bash
cd flutter_application_1
flutter pub get
flutter run
```

The app connects directly to the production Supabase project. To use a local backend, change `AppConfig.backendUrl` in [lib/core/config.dart](flutter_application_1/lib/core/config.dart).

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
playwright install chromium --with-deps
```

Create `backend/.env`:
```
SUPABASE_URL=https://rwwumtwelwncdqmvhdkt.supabase.co
SUPABASE_SERVICE_KEY=<service role key from Supabase dashboard>
ANTHROPIC_API_KEY=<from console.anthropic.com>
APP_SECRET_KEY=<any random string>
APP_ENV=development
SENDGRID_API_KEY=<optional for local dev>
CORS_ORIGINS=["http://localhost:3000"]
```

```bash
uvicorn app.main:app --reload
# API docs: http://localhost:8000/docs
```

---

## Navigation (Flutter)

All routes are in [lib/core/router.dart](flutter_application_1/lib/core/router.dart).

```
/welcome                    → WelcomeScreen
/login                      → LoginScreen
/register                   → RegisterScreen

/avg-toestemming            → AvgConsentScreen       ← AVG gate (must pass to reach CV upload)
  /avg-toestemming/cv       → CvUploadScreen          ← child route, not deep-linkable

/onboarding/start           → OnboardingStartScreen
/onboarding/profiel         → ProfileFormScreen

ShellRoute (bottom nav)
  /zoeken                   → JobSearchScreen
    /zoeken/resultaten      → JobResultsScreen
    /zoeken/detail          → JobDetailScreen
      /zoeken/detail/brief  → LetterPreviewScreen
  /sollicitaties            → ApplicationsScreen
  /profiel                  → ProfileScreen
  /instellingen             → SettingsScreen

/bevestigd                  → ConfirmationScreen
```

**Auth guard** (in `GoRouter.redirect`): unauthenticated users are sent to `/welcome`; authenticated users are bounced from auth routes to `/zoeken`. The redirect fires whenever the Supabase auth stream emits via `GoRouterRefreshStream`.

---

## State (Riverpod providers)

| Provider | File | What it holds |
|---|---|---|
| `authNotifierProvider` | `auth_provider.dart` | Supabase session, `signIn`, `signUp`, `signOut`, `deleteAccount` |
| `authStateProvider` | `auth_provider.dart` | Raw `Stream<AuthState>` — drives router refresh |
| `profileProvider` | `profile_provider.dart` | `AsyncValue<UserProfile?>`, CRUD, `deleteCv` |
| `jobSearchProvider` | `jobs_provider.dart` | `AsyncValue<List<Job>>` — search results |
| `selectedJobProvider` | `jobs_provider.dart` | `StateProvider<Job?>` — job tapped by user |
| `letterGenerationProvider` | `jobs_provider.dart` | `AsyncValue<String>` — generated letter body |
| `apiClientProvider` | `jobs_provider.dart` | `ApiClient` instance (reads auth token) |

---

## Backend API endpoints

Base path: `/api/v1`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | No | Health check |
| GET | `/profile` | JWT | Get own profile |
| PUT | `/profile` | JWT | Upsert profile |
| POST | `/jobs/search` | JWT | Scrape + return jobs |
| POST | `/apply/letter` | JWT | Generate motivation letter |
| POST | `/apply/send` | JWT | Send application email |
| GET | `/apply/history` | JWT | List past applications |
| POST | `/abuse/report` | No | Report a spam application |

All authenticated endpoints use `get_current_user_id` which validates the Supabase JWT and touches `profiles.last_active_at`.

Rate limits (in-memory, per user):
- `/apply/letter`: 10 letters/day, 3 per job
- `/apply/send`: 20 applications/day, 1 per company per 7 days

---

## Supabase schema

Tables (all with RLS, users can only access their own rows):

| Table | Key columns |
|---|---|
| `profiles` | `user_id`, `naam`, `cv_path`, `cv_expires_at`, `cv_warning_sent`, `writing_style`, `last_active_at` |
| `jobs` | `id`, `title`, `company`, `url`, `description_snippet`, `scraped_for_user` |
| `applications` | `id`, `job_id`, `user_id`, `letter_nl`, `status`, `sent_at` |
| `abuse_reports` | `reporter_email`, `sender_email`, `description` (service role only) |
| `deletion_queue` | `user_id`, `reason` (service role only) |

Migrations run in order: `001` → `004`. Apply via Supabase SQL editor or `supabase db push`.

---

## Supabase Edge Functions

All deployed to project `rwwumtwelwncdqmvhdkt`.

| Function | Trigger | What it does |
|---|---|---|
| `delete-account` | Flutter app (`supabase.functions.invoke`) | Deletes auth user + Storage CV + cascades profile/applications |
| `warn-cv-expiry` | pg_cron daily 01:00 UTC | Emails users whose CV expires in ≤7 days |
| `cleanup-expired-cvs` | pg_cron daily 02:30 UTC | Removes expired CV files from Storage |
| `purge-inactive` | pg_cron weekly Sun 03:00 UTC | Calls `admin.deleteUser` for 90-day inactive users |

Secrets to set per function in Supabase dashboard:
- All functions: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- Cron-triggered functions: `CRON_SECRET`
- `delete-account`: also `SUPABASE_ANON_KEY`
- `warn-cv-expiry`: also `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`

---

## AVG / GDPR compliance

| Rule | Where enforced |
|---|---|
| 1. Explicit consent before CV upload | `AvgConsentScreen` — checkbox must be ticked; `/avg-toestemming/cv` is a child route (not deep-linkable) |
| 2. EU servers only | Supabase `eu-central-1`; Claude API processes data in transit only |
| 3. Delete all data on request | `delete-account` Edge Function — cascades everything |
| 4. CV retention (7/30/90 days) + warning | `cv_upload_screen.dart` sets `cv_expires_at`; `warn-cv-expiry` Edge Function sends email; `cleanup-expired-cvs` removes the file |
| 5. No AI training / no third-party sharing | Anthropic API terms; letter body not logged |
| 6. 90-day inactivity purge | `last_active_at` touched on every API call; `purge-inactive` Edge Function processes `deletion_queue` weekly |
| 7. Every automated decision visible + editable | Letter preview screen shows full letter; user can edit before sending |

---

## Key environment variables

### Backend (Railway)

| Variable | Description |
|---|---|
| `SUPABASE_URL` | `https://rwwumtwelwncdqmvhdkt.supabase.co` |
| `SUPABASE_SERVICE_KEY` | Service role key (Supabase → Settings → API) |
| `ANTHROPIC_API_KEY` | From console.anthropic.com |
| `APP_SECRET_KEY` | Random secret for signing |
| `APP_ENV` | `production` |
| `CORS_ORIGINS` | `["https://opstap.nl"]` |
| `SENDGRID_API_KEY` | From sendgrid.com |
| `SENDGRID_FROM_EMAIL` | `sollicitaties@opstap.nl` |

### Flutter (`lib/core/config.dart`)

| Constant | Description |
|---|---|
| `supabaseUrl` | Supabase project URL |
| `supabaseAnonKey` | Supabase anon/public key (safe to commit) |
| `backendUrl` | Railway URL — update after deploy |
| `cvBucket` | `cvs` |

---

## Adding a new screen

1. Create `lib/screens/<area>/<name>_screen.dart` extending `ConsumerWidget` or `ConsumerStatefulWidget`
2. Add a `GoRoute` in [lib/core/router.dart](flutter_application_1/lib/core/router.dart)
3. Run `/dutch-copy` agent before marking done
4. Run `/avg-checker` if the screen touches user data or CV files

## Adding a new backend endpoint

1. Add function in the relevant `app/api/v1/*.py` router
2. Add `user_id: str = Depends(get_current_user_id)` for auth
3. Run `/security` agent before merging
4. Run `/avg-checker` if the endpoint handles personal data
