# Cowork prompt — Add OAuth redirect URLs to Supabase

Copy everything below the line into Cowork.

---

You are helping me configure OAuth redirect URLs in a Supabase project. Follow these steps exactly.

## Step 1 — Open Supabase Auth settings
Go to https://supabase.com/dashboard/project/rwwumtwelwncdqmvhdkt/auth/url-configuration

## Step 2 — Add redirect URLs
In the "Redirect URLs" section, click "Add URL" and add each of these one by one:

1. `http://localhost:3000` (already there probably — skip if so)
2. `http://localhost:*` (for Flutter web dev on any port)
3. `opstap://callback` (deep link for mobile — iOS and Android)
4. `opstap://reset-password` (deep link for password reset)
5. `https://opstap.nl` (production web — add even if not live yet)
6. `https://www.opstap.nl`

7. `https://opstapapp-production.up.railway.app` (Railway backend)

## Step 3 — Set Site URL
In the "Site URL" field, check what is currently set. For now it should be:
`http://localhost:3000`

Leave it as is for now — we'll update to the production URL when we go live.

## Step 4 — Confirm
Take a screenshot or tell me the list of redirect URLs that are now saved.
