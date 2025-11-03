// adapters/quotesAdapter.ts
import { cfg, safeFetch } from './config';
import type { Quote } from './types';

// Fetch quotes within an optional date range; backend should support filtering.
export async function fetchQuotes(params?: { start?: string; end?: string }): Promise<Quote[]> {
  const url = params?.start && params?.end
    ? `${cfg.quotesUrl}?start=${encodeURIComponent(params.start)}&end=${encodeURIComponent(params.end)}`
    : cfg.quotesUrl;
  try {
    const data = await safeFetch(url, cfg.quotesKey);
    return Array.isArray(data) ? data as Quote[] : data.items as Quote[];
  } catch (e) {
    console.warn('fetchQuotes fallback (mock) due to', e);
    // Mock fallback for local dev
    const mock: Quote[] = [
      { id: 'Q-1001', date: '2025-10-27', customer: 'CVS', productId: 'TRZ-10', productName: 'Tirzepatide 10mg Kit', units: 10, unitPrice: 120, landedCost: 80, leadDays: 3, reliability: 0.92, region: 'US', status: 'paid' },
      { id: 'Q-1002', date: '2025-10-28', customer: 'MedCore', productId: 'TRZ-15', productName: 'Tirzepatide 15mg Kit', units: 4, unitPrice: 155, landedCost: 110, leadDays: 5, reliability: 0.9, region: 'US', status: 'accepted' },
    ];
    return mock;
  }
}
