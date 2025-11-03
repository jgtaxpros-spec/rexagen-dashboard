// adapters/supplierCostsAdapter.ts
import { cfg, safeFetch } from './config';
import type { SupplierCost } from './types';

export async function fetchSupplierCosts(productId?: string): Promise<SupplierCost[]> {
  const url = productId ? `${cfg.supplierCostsUrl}?productId=${encodeURIComponent(productId)}` : cfg.supplierCostsUrl;
  try {
    const data = await safeFetch(url, cfg.supplierCostsKey);
    return Array.isArray(data) ? data as SupplierCost[] : data.items as SupplierCost[];
  } catch (e) {
    console.warn('fetchSupplierCosts fallback (mock) due to', e);
    const mock: SupplierCost[] = [
      { supplierId: 'SUP-US-01', productId: 'TRZ-10', region: 'US', unitCost: 70, shippingEst: 6, dutiesEst: 4, reliabilityScore: 95, leadMin: 2, leadMax: 3, moqUnits: 1, effectiveDate: '2025-10-26' },
      { supplierId: 'SUP-CN-02', productId: 'TRZ-10', region: 'CN', unitCost: 55, shippingEst: 10, dutiesEst: 8, reliabilityScore: 88, leadMin: 5, leadMax: 7, moqUnits: 5, effectiveDate: '2025-10-25' },
    ];
    return mock;
  }
}
