// adapters/config.ts
// Reads endpoints/keys from environment at build/runtime.
// Adjust to your framework (Vite/Next). Both examples shown.

export const cfg = {
  quotesUrl: process.env.REXAGEN_QUOTES_URL || (typeof import.meta !== 'undefined' ? (import.meta as any).env?.REXAGEN_QUOTES_URL : undefined),
  quotesKey: process.env.REXAGEN_QUOTES_API_KEY || (typeof import.meta !== 'undefined' ? (import.meta as any).env?.REXAGEN_QUOTES_API_KEY : undefined),

  supplierCostsUrl: process.env.REXAGEN_SUPPLIER_COSTS_URL || (typeof import.meta !== 'undefined' ? (import.meta as any).env?.REXAGEN_SUPPLIER_COSTS_URL : undefined),
  supplierCostsKey: process.env.REXAGEN_SUPPLIER_COSTS_API_KEY || (typeof import.meta !== 'undefined' ? (import.meta as any).env?.REXAGEN_SUPPLIER_COSTS_API_KEY : undefined),

  pricingHistoryUrl: process.env.REXAGEN_PRICING_HISTORY_URL || (typeof import.meta !== 'undefined' ? (import.meta as any).env?.REXAGEN_PRICING_HISTORY_URL : undefined),
  pricingHistoryKey: process.env.REXAGEN_PRICING_HISTORY_API_KEY || (typeof import.meta !== 'undefined' ? (import.meta as any).env?.REXAGEN_PRICING_HISTORY_API_KEY : undefined),

  inventoryUrl: process.env.REXAGEN_INVENTORY_URL || (typeof import.meta !== 'undefined' ? (import.meta as any).env?.REXAGEN_INVENTORY_URL : undefined),
  inventoryKey: process.env.REXAGEN_INVENTORY_API_KEY || (typeof import.meta !== 'undefined' ? (import.meta as any).env?.REXAGEN_INVENTORY_API_KEY : undefined),
};

function reqHeaders(apiKey?: string) {
  const h: Record<string,string> = { 'Content-Type': 'application/json' };
  if (apiKey) h['Authorization'] = `Bearer ${apiKey}`;
  return h;
}

export async function safeFetch(url?: string, apiKey?: string) {
  if (!url) throw new Error('Missing endpoint URL');
  const res = await fetch(url, { headers: reqHeaders(apiKey) });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  return res.json();
}
