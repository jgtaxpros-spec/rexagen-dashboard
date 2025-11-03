// services/marginLeak.ts
// Builds a Margin Leak Snapshot from a DashboardSnapshot.

import type { DashboardSnapshot } from './dashboardData';

export type MarginLeakRow = {
  quoteId: string;
  productName: string;
  customer: string;
  unitPrice: number;
  landedCost: number;
  marginPct: number;
};

export type MarginLeakReport = {
  generatedAtET: string;
  totalFlagged: number;
  rows: MarginLeakRow[];
  alert: { type: 'margin-leak'; title: string; message: string; rows: MarginLeakRow[] };
};

function toETISOString(d = new Date()) {
  const opts: Intl.DateTimeFormatOptions = {
    timeZone: 'America/New_York', hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  };
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', opts).formatToParts(d).map(p => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:00-05:00`;
}

export function buildMarginLeakSnapshot(snap: DashboardSnapshot): MarginLeakReport {
  const rows: MarginLeakRow[] = snap.quotes
    .map(q => {
      const m = q.unitPrice > 0 ? (q.unitPrice - q.landedCost) / q.unitPrice : 0;
      return {
        quoteId: q.id,
        productName: q.productName,
        customer: q.customer,
        unitPrice: q.unitPrice,
        landedCost: q.landedCost,
        marginPct: m,
      }
    })
    .filter(r => r.marginPct < 0.25)
    .sort((a, b) => a.marginPct - b.marginPct);

  const report: MarginLeakReport = {
    generatedAtET: toETISOString(),
    totalFlagged: rows.length,
    rows,
    alert: {
      type: 'margin-leak',
      title: 'Margin Leak Snapshot',
      message: rows.length > 0 ? `Detected ${rows.length} quotes below 25% margin.` : 'No margin leaks detected.',
      rows,
    }
  };
  return report;
}
