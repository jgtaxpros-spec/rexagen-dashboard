# Rexagen Powerhouse Dashboard — Vercel Deployment

## Quick Deploy
1) **Download & unzip** this project.
2) `npm install`
3) `npm run dev` → http://localhost:3000
4) Push to GitHub and **Import** into **Vercel** → get a public URL instantly.

## Scheduled Margin Leak Snapshot
- An API route exists at `/api/run-margin-leak`.
- `vercel.json` contains a cron: **Mon 13:30 UTC** (~08:30 ET standard; adjust for DST if needed).
  - To adjust, edit `vercel.json` and redeploy.

## Structure
- `app/page.tsx` → renders the dashboard and starts a browser heartbeat scheduler.
- `app/api/run-margin-leak/route.ts` → serverless endpoint to run the snapshot job on demand.
- `src/rexagen_powerhouse_dashboard.tsx` → main dashboard UI.
- `src/adapters/*` → data adapters (env-driven).
- `src/services/*` → composed snapshot + scheduler/margin leak logic.
- `src/state/alertsStore.ts` → basic alert state.

## Environment
Copy the existing `.env.example` from your previous bundle and set it here for your endpoints/keys,
or configure **Vercel Project Environment Variables** accordingly.

## Production Link
Once deployed on Vercel, your dashboard will be available at a URL like:
https://rexagen-powerhouse-dashboard.vercel.app

