# Opstap — Claude Instructions

## What is this project?
Opstap is a Dutch job application automation app for iOS and Android.
It helps users upload a CV or enter their profile manually, search Dutch job boards, and auto-apply with AI-generated motivation letters.

## Working directory
`C:\Users\donn9\Opstap.App`

## Current phase
Beta — see docs/PROGRESSMAP.html for full details and progress checklist.

## Language
- This project is in **English** in code, comments, and planning docs
- The app UI is in **Dutch** (v1), multi-language in v2
- Chat with the user in **English** unless they switch to Dutch

## Stack
| Layer | Tool |
|---|---|
| Mobile | Flutter (iOS + Android) |
| Backend | Python FastAPI |
| AI | Claude API (claude-sonnet-4-6) |
| Database + Auth | Supabase (EU region) |
| File storage | Supabase Storage (EU, encrypted) |
| Job scraping | Playwright |
| Version control | GitHub — dautomaite-spec/opstap.app (private) |
| UI design | Google Stitch (primary) — Figma backup only |

## UI design workflow
- Design all screens in **Google Stitch** first (stitch.withgoogle.com)
- Claude Code pulls designs via Stitch MCP (`@_davideast/stitch-mcp`)
- Stitch exports native Flutter widget code
- Figma is available but only used when Stitch can't handle something
- Do not use Figma by default

## Git config
- user.name: dautomaite-spec
- user.email: dautomaite-spec@users.noreply.github.com
- Always create a new branch for changes, never push directly to master
- PR first, merge after

## Key decisions
- Every step in the user flow is optional — user can stop at any point
- First screen asks: upload CV or enter manually
- AVG/GDPR consent shown before any CV upload
- Extracted CV data is always editable before use
- Dutch job boards: Indeed NL, LinkedIn NL, Jobbird, Nationale Vacaturebank
- Motivation letters generated in Dutch by Claude API
- EU servers only — no data leaves the EU
- User can delete all their data at any time

## MVP (v1) scope
1. Resume upload
2. Manual profile setup screen
3. Job search (NL boards)
4. Auto-apply (email + web form)
5. AI motivation letter per job (Dutch)
6. AVG consent flow

## Out of scope for v1
- Resume builder (LLM)
- Auto-extract from CV (v2)
- Dashboard/tracker
- Multi-language
- Ads + freemium

## AVG / GDPR rules
1. Explicit consent before CV upload
2. EU servers only
3. User can delete all data at any time
4. CV stored encrypted for a user-defined period (default 30 days, options: 7 / 30 / 90 days). Warning sent 7 days before expiry, auto-deleted on expiry unless user extends. User can delete manually at any time.
5. No data used for training or shared with third parties
6. Auto-delete after 90 days inactivity
7. Every automated decision is visible and editable by the user

## The agentic build loop (planner → builder → tester)

All non-trivial feature and fix work runs through this loop. Agents cannot message
each other directly — the main session routes their file-based artifacts, all under
`.claude/plans/<slug>/`:

1. `/planner` writes `plan.md` (scope, steps, risks, acceptance criteria)
2. `/builder` implements it on a feature branch, writes `build-report.md`
3. `/tester` (Mode 1) checks the acceptance criteria, writes `test-report.md` with PASS/FAIL
4. On FAIL: send `/builder` back in with the test report (fix round). Repeat 2–4 until PASS.
5. On PASS: run the release gates below that the plan's risk section flags, then `/updater`, then commit/push/PR.

Trivial changes (typo, copy tweak, one-line fix) may skip the loop but never the release gates that apply.

## Agent auto-trigger rules

These agents live in `.claude/agents/`. Run them automatically at the points below — do not wait to be asked.

| Agent | Trigger |
|---|---|
| `/planner` | Start of any non-trivial feature/fix (writes the plan) — also for "what next / which approach / unblock me" decisions |
| `/builder` | When a plan exists and needs implementing, or a test report needs a fix round |
| `/tester` | Mode 1: after every build, against the plan's acceptance criteria. Mode 2: browser E2E of real UI flows — max 3 link checks per run |
| `/security` | Release gate: after creating or modifying any backend endpoint (`backend/app/api/`) or auth flow |
| `/avg-checker` | Release gate: after any change touching user data, CV files, Supabase storage, or auth flows |
| `/dutch-copy` | Release gate: after finishing any screen (web or Flutter) — before marking it done |
| `/stylist` | Release gate: after generating or editing any screen (web or Flutter/Stitch) |
| `/updater` | **Before every `git push`** — updates planning, wiki, roadmap, changelog, and cleans temp files |
| `/scraper-health` | After any job-search or scraper change, or when search results degrade — cheap script-based check, no browser |

- If an agent reports a violation or score below 7/10, fix the issues before continuing.
- Do not skip agents to save time — they exist because these errors have real consequences (legal, security, UX).
- `/planner` answers navigation questions and unblocks work (this role moved from the retired `/developer` agent). If planner says skip, skip and continue. Only surface to the user when both Claude and planner are fully stuck.

## What NOT to do
- Do not use the name Kabir or reference the old Kabir project
- Do not push directly to master
- Do not add features beyond MVP scope without asking
- Do not store any personal data outside EU region
- Do not skip AVG consent in any flow involving user data
