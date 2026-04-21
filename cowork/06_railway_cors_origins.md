# Cowork prompt — Set CORS_ORIGINS on Railway

Copy everything below the line into Cowork.

---

You are helping me configure an environment variable on Railway for the Opstap backend.

## Context
The FastAPI backend reads `CORS_ORIGINS` as a list. The default fallback is only `["http://localhost:3000"]`, which is too restrictive for production.

## Step 1 — Open Railway
Go to your Railway project → select the **opstapapp** service → click **Variables**.

## Step 2 — Set or update CORS_ORIGINS
Add or update this variable:

**Key:** `CORS_ORIGINS`  
**Value:**
```
["http://localhost:3000","http://localhost:*","https://opstap.nl","https://www.opstap.nl","https://opstapapp-production.up.railway.app"]
```

(Paste the value as a single line, no line breaks.)

## Step 3 — Redeploy
After saving the variable, Railway will automatically redeploy. Wait for the deploy to finish (green status).

## Step 4 — Confirm
Visit https://opstapapp-production.up.railway.app/health — it should return `{"status":"ok"}`.

Done.
