# Cowork prompt — Deploy Opstap Edge Functions to Supabase

Copy everything below the line into Cowork.

---

You are helping me deploy two Supabase Edge Functions and apply a database migration. Follow each step exactly.

## Step 1 — Apply migration 004

Go to https://supabase.com/dashboard → project rwwumtwelwncdqmvhdkt → SQL editor.

Paste and run the full contents of:
`backend/supabase/migrations/004_writing_style_and_cv_expiry.sql`

If it fails on the `cron.schedule` calls, go to **Database → Extensions** first, enable **pg_cron**, then re-run.

## Step 2 — Deploy `delete-account` Edge Function

In the Supabase dashboard → **Edge Functions** → **Deploy a new function**.

- Function name: `delete-account`
- Paste the contents of: `backend/supabase/functions/delete-account/index.ts`

After saving, go to the function's **Secrets** tab and add:
- `SUPABASE_URL` = `https://rwwumtwelwncdqmvhdkt.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY` = (service role key from Settings → API)
- `SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3d3VtdHdlbHduY2RxbXZoZGt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzMjM2NzIsImV4cCI6MjA5MTg5OTY3Mn0.2jjwhk7sENrhwmgzss6UTRMk0x0tgcA8Ld-aMwQXHGg`

## Step 3 — Deploy `purge-inactive` Edge Function

Same as Step 2 but:
- Function name: `purge-inactive`
- Paste contents of: `backend/supabase/functions/purge-inactive/index.ts`

Secrets needed:
- `SUPABASE_URL` = `https://rwwumtwelwncdqmvhdkt.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY` = (same service role key)
- `CRON_SECRET` = (generate a random string, e.g. `openssl rand -hex 32`, and save it — you'll need it for the pg_cron call below)

## Step 4 — Wire pg_cron to call `purge-inactive`

In the SQL editor, run:

```sql
select cron.schedule(
  'call-purge-inactive-weekly',
  '0 3 * * 0',
  format(
    $$
    select net.http_post(
      url := '%s/functions/v1/purge-inactive',
      headers := '{"x-cron-secret": "<YOUR_CRON_SECRET>", "Content-Type": "application/json"}'::jsonb,
      body := '{}'::jsonb
    );
    $$,
    current_setting('app.supabase_url', true)
  )
);
```

Replace `<YOUR_CRON_SECRET>` with the value you set in Step 3.

## Step 3b — Deploy `warn-cv-expiry` Edge Function

- Function name: `warn-cv-expiry`
- Paste contents of: `backend/supabase/functions/warn-cv-expiry/index.ts`

Secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET` (same as above), `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL=sollicitaties@opstap.nl`

## Step 3c — Deploy `cleanup-expired-cvs` Edge Function

- Function name: `cleanup-expired-cvs`
- Paste contents of: `backend/supabase/functions/cleanup-expired-cvs/index.ts`

Secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`

## Step 3d — Wire daily cron to call all three daily functions

In the SQL editor, after enabling pg_cron and `pg_net` extension, run:

```sql
-- Call warn-cv-expiry daily at 01:00 UTC (before expiry cleanup)
select cron.schedule(
  'call-warn-cv-expiry',
  '0 1 * * *',
  format($q$
    select net.http_post(
      url := 'https://rwwumtwelwncdqmvhdkt.supabase.co/functions/v1/warn-cv-expiry',
      headers := '{"x-cron-secret": "<YOUR_CRON_SECRET>", "Content-Type": "application/json"}'::jsonb,
      body := '{}'::jsonb
    );
  $q$)
);

-- Call cleanup-expired-cvs daily at 02:30 UTC (after pg_cron SQL job at 02:00)
select cron.schedule(
  'call-cleanup-expired-cvs',
  '30 2 * * *',
  format($q$
    select net.http_post(
      url := 'https://rwwumtwelwncdqmvhdkt.supabase.co/functions/v1/cleanup-expired-cvs',
      headers := '{"x-cron-secret": "<YOUR_CRON_SECRET>", "Content-Type": "application/json"}'::jsonb,
      body := '{}'::jsonb
    );
  $q$)
);
```

Replace `<YOUR_CRON_SECRET>` with the same value used in Step 3.

## Step 5 — Verify

Back in Edge Functions, click `delete-account` → **Test**. Send a POST with an Authorization header containing a valid user JWT. You should get `{"deleted": true}` and the user should be gone from the Auth dashboard.

Tell me when all steps are done and paste the `delete-account` function URL (format: `https://rwwumtwelwncdqmvhdkt.supabase.co/functions/v1/delete-account`).
