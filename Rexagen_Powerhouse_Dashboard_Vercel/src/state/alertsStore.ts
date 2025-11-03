// state/alertsStore.ts
// Minimal in-memory alert store for the dashboard UI.
// Replace with your app's state manager if needed (Redux/Zustand/Context).

export type AlertItem = { type: string; title: string; message: string; [k: string]: any };

let listeners: Array<() => void> = [];
let alerts: AlertItem[] = [];

export function subscribeAlerts(fn: () => void) {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter(l => l !== fn);
  };
}

export function getAlerts() {
  return alerts;
}

export function pushAlerts(items: AlertItem[]) {
  alerts = [...items, ...alerts].slice(0, 100); // keep last 100
  listeners.forEach(l => l());
}

export function clearAlerts() {
  alerts = [];
  listeners.forEach(l => l());
}
