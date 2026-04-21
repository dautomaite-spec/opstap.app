# Cowork prompt — Deploy Opstap backend to Railway

Copy everything below the line into Cowork.

---

You are helping me deploy a Python FastAPI backend to Railway. Follow these steps exactly and tell me the deployed URL when done.

## Step 1 — Open Railway
Go to https://railway.app and log in with GitHub (use the dautomaite-spec account).

## Step 2 — Create a new project
Click "New Project" → "Deploy from GitHub repo" → select the repo "dautomaite-spec/opstap.app".

When asked to select a folder, set the root directory to: `backend`

## Step 3 — Set environment variables
Go to the service settings → Variables tab. Add the following variables one by one:

```
SUPABASE_URL=https://rwwumtwelwncdqmvhdkt.supabase.co
SUPABASE_SERVICE_KEY=<paste the service role key from the Supabase project settings>
ANTHROPIC_API_KEY=<paste the Anthropic API key>
SENDGRID_API_KEY=<paste the SendGrid API key — leave empty for now if not set up>
SENDGRID_FROM_EMAIL=sollicitaties@opstap.nl
SENDGRID_FROM_NAME=Opstap
APP_ENV=production
CORS_ORIGINS=["https://opstap.nl","https://www.opstap.nl"]
```

Note: get the Supabase service role key from https://supabase.com/dashboard → project rwwumtwelwncdqmvhdkt → Settings → API → service_role key (secret).

## Step 4 — Trigger deploy
Railway should auto-deploy after setting variables. If not, click "Deploy" manually.

Wait for the build to finish. The Dockerfile is already set up at backend/Dockerfile.

## Step 5 — Get the URL
Once deployed, go to Settings → Networking → click "Generate Domain". Copy the URL (format: something.railway.app).

## Step 6 — Verify
Open a new tab and go to: `<your-railway-url>/health`
You should see: `{"status": "ok"}`

Tell me:
1. The Railway URL (e.g. https://opstap-backend.up.railway.app)
2. Whether the /health check returned {"status": "ok"}
