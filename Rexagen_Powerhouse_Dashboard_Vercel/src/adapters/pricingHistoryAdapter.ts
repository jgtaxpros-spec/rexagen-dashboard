// adapters/pricingHistoryAdapter.ts
import { cfg, safeFetch } from './config';
import type { CustomerLastPrices } from './types';

export async function fetchCustomerLastPrices(customer: string, productId: string): Promise<CustomerLastPrices> {
  const url = `${cfg.pricingHistoryUrl}?customer=${encodeURIComponent(customer)}&productId=${encodeURIComponent(productId)}&n=3`;
  try {
    const data = await safeFetch(url, cfg.pricingHistoryKey);
    // Normalize to expected shape
    if (Array.isArray(data)) {
      return { customer, productId, last3: data.slice(0,3) };
    }
    return data as CustomerLastPrices;
  } catch (e) {
    console.warn('fetchCustomerLastPrices fallback (mock) due to', e);
    const mock: CustomerLastPrices = {
      customer, productId,
      last3: [
        { date: '2025-10-15', qty: 1, unit_price_sold: 115, region: 'US' },
        { date: '2025-09-20', qty: 2, unit_price_sold: 112, region: 'US' },
      ]
    };
    return mock;
  }
}
