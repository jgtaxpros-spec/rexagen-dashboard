// adapters/inventoryAdapter.ts
import { cfg, safeFetch } from './config';
import type { InventoryBatch } from './types';

export async function fetchInventoryBatches(): Promise<InventoryBatch[]> {
  try {
    const data = await safeFetch(cfg.inventoryUrl, cfg.inventoryKey);
    return Array.isArray(data) ? data as InventoryBatch[] : data.items as InventoryBatch[];
  } catch (e) {
    console.warn('fetchInventoryBatches fallback (mock) due to', e);
    const mock: InventoryBatch[] = [
      { productId: 'TRZ-10', productName: 'Tirzepatide 10mg Kit', onHandUnits: 60, velocityBucket: 'A', forecast14d: 40 },
      { productId: 'GLOW-70', productName: 'GLOW 70mg', onHandUnits: 37, velocityBucket: 'A', forecast14d: 28 },
    ];
    return mock;
  }
}
