# Test report: paste-text-fallback
Status: PASS

Verified against `.claude/plans/paste-text-fallback/plan.md` on branch `feat/paste-text-fallback` (uncommitted working tree). All commands re-run by the tester, not taken from the build report.

## Criteria checked

### 1. Sanitizer + heuristics unit checks — PASS
Re-ran the plan's exact inline script (`ADMIN_API_KEY=dummy`, system Python 3.12, from `backend/`): output `OK`. All four `_looks_blocked` asserts (Cloudflare text, DPG consent >300 chars, short page, real vacancy negative), the 6000-char cap, and the injection catch pass.

### 2. Endpoint pytest — PASS
`cd backend && ADMIN_API_KEY=dummy python -m pytest tests/test_from_text_fallback.py -q` → **6 passed** in 0.96s (one unrelated gotrue DeprecationWarning). Read the test file: all six plan-specified cases are present and assert debit/refund counts via a recording FakeSupabase, exactly as specified (happy path 1 debit/0 refunds; too-short 0 debits; injection 1 debit/0 refunds; fetch-fail and Cloudflare-shell each 1 debit/1 refund with `detail.code == "fetch_blocked"`; backward-compat URL path 200).

### 3. i18n completeness — PASS
All 4 keys (`pasteTextFallbackHint`, `pasteTextFallbackPlaceholder`, `pasteTextFallbackButton`, `pasteTextTooShort`) present in exactly 6 of 6 locale files; all 6 JSON files parse. Dutch copy matches the plan verbatim; no em dashes in any locale; translations follow neighbouring-key tone (informal in tr, formal elsewhere).

### 4. Frontend compiles — PASS
From `web/`: `npx tsc --noEmit` → exit 0. `npm run build` (Next.js 16.2.7) → exit 0, 36 pages generated. (Builder had skipped `npm run build`; tester ran it.)

### 5. UI state in browser — DEFERRED
Requires a deployed preview or full local stack; explicitly skipped per tester instructions. Must be checked after deploy: fetch_blocked pivot shows textarea with Dutch hint, URL stays filled, no red error, resubmit with text yields letter.

### 6. No dead-end regression — PASS
Covered by `test_url_path_backward_compat` (no `job_text`, real vacancy HTML → 200, title extracted, 1 debit, 0 refunds). Optional live curl against local uvicorn not run (redundant with the test; live path also deferred with criterion 5).

## Special-attention audits

### Credit debit/refund semantics per exit path (code read at apply.py:591-714)
Text path:
- `job_text` <200 chars → 422 string detail **before** debit RPC (apply.py:594-596) — zero credits touched. Confirmed by test.
- Insufficient credits → 402, atomic RPC returned False, nothing to refund.
- Sanitize `PromptInjectionError` → 422, debit stands, no refund, **no suspension** (matches plan's third-party-content policy, uses `sanitize_and_check_job_text`, not the profile variant).
- `generate_letter` `PromptInjectionError` → 422, no refund.
- `generate_letter` other exception → refund reason `letter_from_text_refund` + 500.
- Success → exactly 1 debit (`text:{url[:100]}` reference), 0 refunds.

URL path (all pre-existing refunds preserved):
- Fetch failure → `url_fetch_refund` + fetch_blocked 422.
- `_looks_blocked(description)` → `url_blocked_refund` + fetch_blocked 422 (new; correctly placed BEFORE the no-title check, apply.py:684).
- No title → `url_no_title_refund` + fetch_blocked 422 (detail changed from plain string, per plan step 2).
- Generation injection → 422 no refund; generation other → `letter_from_url_refund` + 500 (both unchanged).

No path double-refunds; no path debits twice.

### Backward compatibility of the from-url body
- `job_text: str | None = None` — requests without the field (and explicit `null`) take the unchanged URL path (`is not None` guard). Verified by test 6 and by reading the diff: URL-path debit reference, fetch, extraction, and success shape are untouched.
- `api.ts` `fromUrl` only adds `job_text` to the body when defined; existing two-arg call in `handleUrlLetter` unchanged.
- Known accepted trade-off (documented in plan): the fetch-fail/no-title 422 `detail` is now an object; old clients rendering `detail` raw would show `[object Object]`. The `ApiError.code` handling ships in the same working tree, and web deploys atomically with the backend, so no real exposure — but backend and web must go out together.

### Build-report deviations — all acceptable
- System Python instead of `backend/venv` (venv is a slim scripts venv without fastapi) — reasonable, documented.
- Created `backend/tests/` (did not exist) — required by the plan's own criterion 2.
- No scope creep found: diff touches exactly the 5 file groups listed in the plan (apply.py, new test file, api.ts, DashboardClient.tsx, 6 locale files). Other working-tree modifications (.claude/launch.json, 3 Flutter files, web/src/middleware.ts untracked) predate this build and are correctly disclaimed.

## Defects
None.

## Follow-ups for the main session (not defects)
- Run criterion 5 (browser UI pivot) after deploy — it is the only unverified behaviour.
- Mandated reviewers per plan before push: /security, /avg-checker, /dutch-copy, /stylist, /updater.
- Deploy backend and web together (object-shaped 422 detail).
