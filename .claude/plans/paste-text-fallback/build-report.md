# Build report: paste-text-fallback
Status: built
Branch: feat/paste-text-fallback

## What was implemented (per plan step)

1. **Backend — extend from-url request body: done.** `UrlLetterRequest` gains `job_text: str | None = None`. In `letter_from_url`, a `body.job_text is not None` branch runs after the SSRF check + profile fetch, before the URL-path debit: length <200 chars → plain-string 422 before any debit; then `debit_one_credit` with reference `text:{url[:100]}`; `sanitize_and_check_job_text(raw, "job_text", 6000)` (job_text variant, injection → 422, no refund, no suspension); title = first non-empty line of raw text [:200], company = hostname-derived fallback, description = clean[:2000]; `generate_letter` with identical semantics (injection → 422 no refund, other exception → `letter_from_text_refund` + 500); same `UrlLetterResponse` shape.
2. **fetch_blocked structured detail: done.** Module-level `_FETCH_BLOCKED_DETAIL = {"code": "fetch_blocked", "message": "Vacaturepagina kon niet worden geladen. Plak de vacaturetekst om verder te gaan."}` raised at: fetch failure (refund `url_fetch_refund` kept), blocked-content case (new), and the no-title case (refund `url_no_title_refund` kept). Invalid-URL / too-short 422s remain plain strings.
3. **Bot-wall heuristics: done.** `_BLOCKED_PAGE_SIGNALS` (Cloudflare, DPG consent, NL cookie walls, hCaptcha, access denied) + `_looks_blocked(description)` = `len < 300 or any signal`. Runs on the extracted `description` after decompose; on hit: refund reason `url_blocked_refund` + fetch_blocked 422. Placed BEFORE the no-title check so a Cloudflare page whose `<title>` extracts still pivots.
4. **web/src/lib/api.ts: done.** `ApiError` gains `public code?: string` (3rd ctor param). `request()` handles object-shaped `detail` (`d.message ?? statusText`, `d.code`). `apply.fromUrl(url, writing_style?, job_text?)` includes `job_text` in the body only when defined.
5. **DashboardClient.tsx hero card: done.** New state `showTextFallback` / `jobTextInput`. `handleUrlLetter` catch pivots on `err.code === 'fetch_blocked'` (shows fallback, clears error). New `handleTextFallback` guards ≥200 chars (`pasteTextTooShort`), reuses `urlLetterLoading`, resubmits `fromUrl(url, writingStyle, jobText)`, hides fallback on success. Fallback form (hint + rows=8 textarea styled like the letter textarea + submit button with generating/label states) rendered when `showTextFallback && !urlLetterResult`. URL input onChange resets fallback state. Result block untouched — copy-and-open still uses `urlLetterInput`.
6. **i18n: done.** 4 keys (`pasteTextFallbackHint/Placeholder/Button`, `pasteTextTooShort`) added to the Dashboard namespace (right after `pasteLinkSubtitle`) in all 6 locales with proper diacritics; no em dashes.

Deviations: none from the plan's logic. Two environment notes:
- `backend/venv` python has no fastapi installed (it is a slim scripts venv); all backend checks were run with the system Python 3.12, which has the full dependency set. Installed `pytest` into system Python (was absent).
- `backend/tests/` did not exist; created it with the plan-specified `test_from_text_fallback.py` (no `__init__.py` needed — pytest rootdir insertion handles imports).

## Files changed
- backend/app/api/v1/apply.py (job_text branch, _FETCH_BLOCKED_DETAIL, _BLOCKED_PAGE_SIGNALS, _looks_blocked, sanitize_and_check_job_text import)
- backend/tests/test_from_text_fallback.py (new — 6 tests per acceptance criterion 2)
- web/src/lib/api.ts (ApiError.code, object-detail handling, fromUrl job_text param)
- web/src/app/dashboard/DashboardClient.tsx (fallback state, handleTextFallback, fallback UI, URL-edit reset)
- web/messages/{nl,en,pl,ro,tr,uk}.json (4 new Dashboard keys each)

Pre-existing unrelated modifications on this branch (NOT mine, do not attribute): .claude/launch.json, opstap/lib/screens/** (3 Flutter files).

## Checks run (commands + results)
- `venv/Scripts/python.exe -m compileall -q app` → OK (compiles; venv lacks runtime deps)
- `ADMIN_API_KEY=dummy python -c "<plan acceptance script 1>"` (system py) → `OK` (all _looks_blocked + sanitizer asserts pass, injection caught)
- `ADMIN_API_KEY=dummy python -c "import app.main"` → `IMPORT_OK`
- `python -m pytest tests/test_from_text_fallback.py -q` → **6 passed** (happy path, too-short no-debit, injection no-refund, fetch-fail fetch_blocked+refund, Cloudflare-shell fetch_blocked+refund, URL backward compat)
- `grep -l pasteText... web/messages/*.json | wc -l` → 6 for all 4 keys; all 6 JSON files parse
- `web: npx tsc --noEmit` → exit 0
- `web: npx eslint src/lib/api.ts src/app/dashboard/DashboardClient.tsx` → 0 errors, 1 pre-existing warning (`autoSearched` unused, line 124, untouched by this change)
- `npm run build` not run (tsc + eslint clean; tester can run it per acceptance criterion 4)

## Notes for tester
- Unit/API: `cd backend && python -m pytest tests/test_from_text_fallback.py -q` (system python, not venv).
- UI flow (mode 2): dashboard hero → paste `https://www.nationalevacaturebank.nl/vacature/anything` → submit → expect Dutch hint "Kon de vacaturepagina niet ophalen (sommige sites blokkeren dit). Plak de vacaturetekst hieronder." + textarea, URL still filled, NO red error line (fetch_blocked clears it). Paste ≥200 chars vacancy text → submit → letter appears in existing result block; "copy and open" opens the original URL.
- Seams most likely to break:
  - `_looks_blocked` false positive on a legitimately short vacancy page (<300 chars visible text) — by design, pivots to paste fallback.
  - The no-title case now returns the object detail instead of "Geen functietitel gevonden op de pagina" — any old client rendering `detail` directly would show the fallback message instead (web client ships the ApiError.code change in the same PR, so fine there).
  - Title extraction in the text path uses the FIRST non-empty line of the raw paste — a paste starting with e.g. "Vacature" or the site name yields that as job_title. Heuristic-only per plan (no LLM extraction).
  - Frontend guard: submit button is enabled for any non-empty text; <200 chars shows `pasteTextTooShort` client-side without calling the API (backend also rejects pre-debit).
  - Fallback state resets on any URL input edit — verify typing in the URL field hides the textarea and clears pasted text.
- Refund reasons to look for in credit_transactions if testing live: `url_blocked_refund` (new), `letter_from_text_refund` (new), `url_fetch_refund` / `url_no_title_refund` (existing, kept).
- Mandated reviewers per plan: /security, /avg-checker, /dutch-copy, /stylist, /updater before push (main session owns these).
