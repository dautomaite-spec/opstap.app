# Cowork prompt — Get Adzuna API key for job search

Copy everything below the line into Cowork.

---

You are helping me get a free Adzuna API key for the Opstap job search backend.

## Step 1 — Register
Go to https://developer.adzuna.com/signup and create a free account.
Use email: d.automaite@gmail.com

## Step 2 — Create an app
After registering, go to the dashboard and create a new app called "Opstap".
You will receive:
- **App ID** (looks like: a1b2c3d4)
- **App Key** (looks like: abc123def456...)

## Step 3 — Add to Railway
Go to Railway → opstapapp service → Variables. Add two variables:

**Key:** `ADZUNA_APP_ID`  
**Value:** [your App ID]

**Key:** `ADZUNA_APP_KEY`  
**Value:** [your App Key]

Click Deploy.

## Step 4 — Tell me
Reply with "Adzuna done" and I will wire up the scraper in the backend code.

Done.
