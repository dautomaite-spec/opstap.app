# Cowork prompt — Set CORS on Railway

Copy everything below the line into Cowork.

---

You are helping me configure CORS environment variables on Railway for the Opstap backend.

## Context
The FastAPI backend has two CORS settings:
- `CORS_ORIGINS` — exact origin list
- `CORS_ORIGIN_REGEX` — regex for pattern-matched origins (e.g. any localhost port)

## Step 1 — Open Railway
Go to your Railway project → select the **opstapapp** service → click **Variables**.

## Step 2 — Set CORS_ORIGINS
Add or update:

**Key:** `CORS_ORIGINS`  
**Value:**
```
["https://opstap.nl","https://www.opstap.nl","https://opstapapp-production.up.railway.app"]
```

## Step 3 — Set CORS_ORIGIN_REGEX
Add:

**Key:** `CORS_ORIGIN_REGEX`  
**Value:**
```
http://localhost:\d+
```

This allows any localhost port during development without hardcoding port numbers.

## Step 4 — Redeploy
Save both variables — Railway will redeploy automatically.

## Step 5 — Confirm
Visit https://opstapapp-production.up.railway.app/health — should return `{"status":"ok"}`.

Done.
