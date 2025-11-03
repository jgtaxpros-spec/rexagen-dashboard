// services/scheduler.ts
// Lightweight scheduler for the Powerhouse Dashboard.
// Two modes:
// 1) Browser-safe heartbeat: checks ET clock every minute; triggers at Mon 08:30 ET.
// 2) Server mode (Node): call `startServerScheduler()` to run in a long-lived process.
//
// NOTE: In serverless environments, prefer the platform's cron (e.g., Vercel/Cloudflare)
// to hit an API route that calls `runMarginLeakJob()`.

import { getDashboardSnapshot } from './dashboardData';
import { buildMarginLeakSnapshot } from './marginLeak';
import { pushAlerts } from '../state/alertsStore';

// --- Utilities ---
function nowInET() {
  // America/New_York offset is handled by Intl; relies on host environment tz DB.
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });
  const parts = Object.fromEntries(fmt.formatToParts(new Date()).map(p => [p.type, p.value]));
  const y = parseInt(parts.year, 10);
  const m = parseInt(parts.month, 10) - 1;
  const d = parseInt(parts.day, 10);
  const hh = parseInt(parts.hour, 10);
  const mm = parseInt(parts.minute, 10);
  return { date: new Date(y, m, d, hh, mm), y, m, d, hh, mm };
}

function isMonday(date: Date) {
  return date.getDay() === 1; // 0=Sun, 1=Mon
}

let lastRunKey: string | null = null;
function dayKeyET() {
  const { y, m, d } = nowInET();
  return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}

// --- Browser-safe Heartbeat ---
export function startBrowserHeartbeat(intervalMs = 60_000) {
  // Poll every minute; when time hits Mon 08:30 ET and not run today -> run job
  const t = setInterval(async () => {
    try {
      const { date, hh, mm } = nowInET();
      const key = dayKeyET();
      if (isMonday(date) && hh === 8 && mm === 30 && lastRunKey !== key) {
        await runMarginLeakJob();
        lastRunKey = key;
      }
    } catch (e) {
      console.warn('Heartbeat scheduler error:', e);
    }
  }, intervalMs);
  return () => clearInterval(t);
}

// --- Server Mode ---
export function startServerScheduler() {
  // Fires every minute; same logic as browser heartbeat.
  return startBrowserHeartbeat(60_000);
}

// --- The Job ---
export async function runMarginLeakJob() {
  const snap = await getDashboardSnapshot(); // you can pass {start,end} if needed
  const report = buildMarginLeakSnapshot(snap);
  // Push into shared alert store for the dashboard to consume
  pushAlerts([report.alert]);
  return report;
}
