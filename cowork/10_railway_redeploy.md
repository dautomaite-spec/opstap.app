# Cowork prompt — Redeploy Railway (service down)

Copy everything below the line into Cowork.

---

The Opstap backend on Railway is returning "Application not found" for all routes including /health. The service needs to be redeployed.

## Step 1 — Open Railway
Go to https://railway.app and log in with the dautomaite-spec GitHub account.

## Step 2 — Find the project
Open the **opstapapp** project → the **opstapapp** service.

## Step 3 — Check why it's down
Click **Deployments** tab. Look at the latest deployment — is it failed, sleeping, or missing?

- If it shows a **failed** deployment: click the failed deploy → read the error logs → report back what you see.
- If the service is **sleeping** (Hobby plan idle): click **Wake** or trigger a new deploy.
- If the service is **deleted** or the project is gone: re-deploy from GitHub as described in cowork/01_railway_deploy.md.

## Step 4 — Trigger a fresh deploy
Click **Deploy** (or redeploy from the latest `master` commit on GitHub: dautomaite-spec/opstap.app).

The Railway root directory must be set to `backend`.

## Step 5 — Confirm
Visit https://opstapapp-production.up.railway.app/health — it should return `{"status":"ok"}`.

Report the result.
