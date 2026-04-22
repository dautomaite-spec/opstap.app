# Cowork prompt — Redeploy Railway with CORS + CV fix

Copy everything below the line into Cowork.

---

You are helping me redeploy the Opstap backend on Railway after two code changes.

## What changed
1. `backend/app/core/config.py` — added `cors_origin_regex` field
2. `backend/app/main.py` — passes `allow_origin_regex` to CORSMiddleware

These are already committed to the `master` branch on GitHub.

## Step 1 — Add Railway env variable
Go to Railway → opstapapp service → Variables. Add:

**Key:** `CORS_ORIGIN_REGEX`  
**Value:** `http://localhost:\d+`

This allows any localhost port to call the backend during development.

## Step 2 — Trigger redeploy
Railway → opstapapp service → Deployments → click **Deploy** (or it may auto-deploy from the GitHub push).

## Step 3 — Confirm
Visit https://opstapapp-production.up.railway.app/health — should return `{"status":"ok"}`.

Done.
