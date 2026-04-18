# Opstap — Claude Instructions

## What is this project?
Opstap is a Dutch job application automation app for iOS and Android.
It helps users upload a CV or enter their profile manually, search Dutch job boards, and auto-apply with AI-generated motivation letters.

## Working directory
`C:\Users\donn9\Opstap.App`

## Current phase
Planning — see PLANNING.md for full details and progress checklist.

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

## Agent auto-trigger rules

These agents live in `.claude/agents/`. Run them automatically at the points below — do not wait to be asked.

| Agent | Trigger |
|---|---|
| `/security` | After creating or modifying any backend endpoint (`backend/app/api/`) or auth flow |
| `/avg-checker` | After any change touching user data, CV files, Supabase storage, or auth flows |
| `/dutch-copy` | After finishing any Flutter screen — before marking it done |
| `/stylist` | After generating or editing any Stitch screen |
| `/developer` | When deciding what to do next, choosing between approaches, or hitting a blocker |

- If an agent reports a violation or score below 7/10, fix the issues before continuing.
- Do not skip agents to save time — they exist because these errors have real consequences (legal, security, UX).
- `/developer` answers navigation questions and unblocks work. If developer says skip, skip and continue to next step. Only surface to the user when both Claude and developer are fully stuck.

## What NOT to do
- Do not use the name Kabir or reference the old Kabir project
- Do not push directly to master
- Do not add features beyond MVP scope without asking
- Do not store any personal data outside EU region
- Do not skip AVG consent in any flow involving user data
