// services/dashboardData.ts
// One-call snapshot composer for the Powerhouse Dashboard.
// Keeps the React component clean by aggregating all data + derived metrics here.

import {
  fetchQuotes,
  fetchSupplierCosts,
  fetchInventoryBatches,
} from '../adapters';
import type { Quote, SupplierCost, InventoryBatch } from '../adapters';

export type ProductAggregate = {
  productId: string;
  productName: string;
  revenue: number;
  cogs: number;
  marginPct: number;
  units: number;
};

export type DashboardKPIs = {
  totalRevenue: number;
  totalCOGS: number;
  grossMarginPct: number;
  activeCustomers: number;
  activeProducts: number;
  profit: number;
};

export type SupplierRow = {
  supplierId: string;
  region: string;
  landedCost: number;
  lead: string;
  reliability: number;
  moq: number;
  effectiveDate: string;
  marginPct: number;      // MarginScore
  speedScore: number;     // SpeedScore
  reliabilityScore: number;
  sourceScore: number;
};

export type DashboardSnapshot = {
  quotes: Quote[];
  supplierCosts: SupplierCost[];
  inventory: InventoryBatch[];
  productAgg: ProductAggregate[];
  kpis: DashboardKPIs;
  supplierRowsByProduct: Record<string, SupplierRow[]>;
};

// ---- Helpers ----
const BASE_MARGIN_MIN = 0.30;

function marginPct(unitPrice: number, landedCost: number) {
  if (unitPrice <= 0) return 0;
  return (unitPrice - landedCost) / unitPrice;
}

function normalizeSpeed(leadDays: number) {
  // SpeedScore = normalize(1/lead_time) with penalty if > 7d
  if (!leadDays || leadDays <= 0) return 1;
  const s = 1 / leadDays;
  return leadDays > 7 ? s * 0.85 : s;
}

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function sourceScore(marginScore: number, speedScore: number, reliabilityScore: number) {
  return 0.45 * marginScore + 0.35 * speedScore + 0.20 * reliabilityScore;
}

// ---- Public API ----
export async function getDashboardSnapshot(params?: { start?: string; end?: string }): Promise<DashboardSnapshot> {
  const quotes = await fetchQuotes(params);
  const inventory = await fetchInventoryBatches();

  // Aggregate per product
  const aggMap = new Map<string, ProductAggregate>();
  for (const q of quotes) {
    const rev = q.units * q.unitPrice;
    const cogs = q.units * q.landedCost;
    const prev = aggMap.get(q.productId);
    if (!prev) {
      aggMap.set(q.productId, {
        productId: q.productId,
        productName: q.productName,
        revenue: rev,
        cogs: cogs,
        marginPct: 0,
        units: q.units,
      });
    } else {
      prev.revenue += rev;
      prev.cogs += cogs;
      prev.units += q.units;
    }
  }
  const productAgg = Array.from(aggMap.values()).map(p => ({
    ...p,
    marginPct: p.revenue > 0 ? (p.revenue - p.cogs) / p.revenue : 0,
  }));

  const totalRevenue = productAgg.reduce((s, p) => s + p.revenue, 0);
  const totalCOGS = productAgg.reduce((s, p) => s + p.cogs, 0);
  const profit = totalRevenue - totalCOGS;
  const grossMarginPct = totalRevenue > 0 ? profit / totalRevenue : 0;
  const activeCustomers = new Set(quotes.map(q => q.customer)).size;
  const activeProducts = productAgg.length;

  const kpis: DashboardKPIs = {
    totalRevenue,
    totalCOGS,
    grossMarginPct,
    activeCustomers,
    activeProducts,
    profit,
  };

  // Supplier rows per product (compute SourceScore using latest quote price as proxy)
  const supplierRowsByProduct: Record<string, SupplierRow[]> = {};

  for (const p of productAgg) {
    const costs: SupplierCost[] = await fetchSupplierCosts(p.productId);
    const lastQuote = quotes.find(q => q.productId === p.productId);
    const customerPrice = lastQuote ? lastQuote.unitPrice : undefined;

    const rows: SupplierRow[] = costs.map(c => {
      const landed = c.unitCost + c.shippingEst + c.dutiesEst;
      const price = customerPrice ?? landed * (1 + BASE_MARGIN_MIN);
      const mScore = clamp01((price - landed) / price);
      const sScore = clamp01(normalizeSpeed(c.leadMin));
      const rScore = clamp01(c.reliabilityScore / 100);
      const ssrc = sourceScore(mScore, sScore, rScore);
      return {
        supplierId: c.supplierId,
        region: c.region,
        landedCost: landed,
        lead: `${c.leadMin}-${c.leadMax}d`,
        reliability: c.reliabilityScore,
        moq: c.moqUnits,
        effectiveDate: c.effectiveDate,
        marginPct: mScore,
        speedScore: sScore,
        reliabilityScore: rScore,
        sourceScore: ssrc,
      };
    }).sort((a, b) => b.sourceScore - a.sourceScore);

    supplierRowsByProduct[p.productId] = rows;
  }

  // Flatten all supplier costs for reference (optional)
  const allCosts = Object.values(supplierRowsByProduct).flat().length;
  const supplierCosts: SupplierCost[] = allCosts ? [] : []; // not required directly by UI when using rows map

  return {
    quotes,
    supplierCosts,
    inventory,
    productAgg,
    kpis,
    supplierRowsByProduct,
  };
}
