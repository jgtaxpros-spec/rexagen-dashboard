// adapters/types.ts
export type Region = 'US' | 'CN' | 'HK' | 'Other';

export interface Quote {
  id: string;
  date: string; // ISO
  customer: string;
  productId: string;
  productName: string;
  units: number;
  unitPrice: number;
  landedCost: number;
  leadDays?: number;
  reliability?: number;
  region?: Region;
  status: 'draft' | 'sent' | 'accepted' | 'paid' | 'declined';
}

export interface SupplierCost {
  supplierId: string;
  productId: string;
  region: Region;
  unitCost: number;
  shippingEst: number;
  dutiesEst: number;
  reliabilityScore: number; // 0-100
  leadMin: number;
  leadMax: number;
  moqUnits: number;
  effectiveDate: string; // ISO
}

export interface InventoryBatch {
  productId: string;
  productName: string;
  onHandUnits: number;
  velocityBucket: 'A' | 'B' | 'C';
  forecast14d: number;
  expiryDays?: number;
}

export interface CustomerLastPrices {
  customer: string;
  productId: string;
  productName?: string;
  last3: Array<{ date: string; qty: number; unit_price_sold: number; region?: Region; supplierId?: string }>;
}
