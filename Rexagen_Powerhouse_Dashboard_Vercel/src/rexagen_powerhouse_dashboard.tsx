import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TrendingUp, TrendingDown, Activity, RefreshCcw, BellRing, Gauge, DollarSign, Percent, Users, Package, ShieldCheck, Timer } from "lucide-react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Legend,
  Bar,
  AreaChart,
  Area
} from "recharts";

/**
 * REXAGEN POWERHOUSE DASHBOARD — PRODUCTION-READY REACT COMPONENT
 * Visual style: Dark background, emerald/silver accents, minimal gridlines.
 * Sorting: Follows Rexagen Sorting & Presentation Protocol.
 * RUO disclaimer: always visible.
 *
 * Integration notes:
 * - Replace mock data loaders with real data services wired to your tables:
 *   CustomerPricingHistory, SupplierCosts, Quotes, InventoryBatches, FeedbackLoop logs.
 * - All sorting, color rules, and thresholds are implemented; plug data into adapters below.
 */

// ---------- Types ----------
export type Quote = {
  id: string;
  date: string; // ISO
  customer: string;
  productId: string;
  productName: string;
  units: number;
  unitPrice: number; // sold price/unit
  landedCost: number; // aggregated landed cost/unit
  leadDays?: number;
  reliability?: number; // 0-100
  region?: "US" | "CN" | "HK" | "Other";
  status: "draft" | "sent" | "accepted" | "paid" | "declined";
};

export type SupplierCost = {
  supplierId: string;
  productId: string;
  region: "US" | "CN" | "HK" | "Other";
  unitCost: number;
  shippingEst: number;
  dutiesEst: number;
  reliabilityScore: number; // 0-100
  leadMin: number;
  leadMax: number;
  moqUnits: number;
  effectiveDate: string; // ISO
};

export type InventoryBatch = {
  productId: string;
  productName: string;
  onHandUnits: number;
  velocityBucket: "A" | "B" | "C"; // per Trend Alerts Module
  forecast14d: number; // units expected to sell in next 14 days
  expiryDays?: number;
};

export type ProductAggregate = {
  productId: string;
  productName: string;
  revenue: number;
  cogs: number;
  marginPct: number; // computed
  units: number;
  trend: "up" | "down" | "flat";
};

// ---------- Utilities & Protocol Rules ----------
const BASE_MARGIN_MIN = 0.30; // 30% (Gold Tier 25% — handled in pricing engine)

function toCurrency(n: number) {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function marginPct(unitPrice: number, landedCost: number) {
  if (unitPrice <= 0) return 0;
  return (unitPrice - landedCost) / unitPrice;
}

function sourceScore(marginScore: number, speedScore: number, reliabilityScore: number) {
  return 0.45 * marginScore + 0.35 * speedScore + 0.20 * reliabilityScore;
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

function sortedBy<T>(rows: T[], key: (r: T) => number | string, dir: "asc" | "desc" = "desc") {
  return [...rows].sort((a, b) => {
    const ka = key(a);
    const kb = key(b);
    if (ka < kb) return dir === "asc" ? -1 : 1;
    if (ka > kb) return dir === "asc" ? 1 : -1;
    return 0;
  });
}

// ---------- Mock Data Adapters (replace with live services) ----------
function useDashboardData(dateRange: string) {
  // In production, fetch via hooks/services. Here we simulate with consistent, realistic data.
  const quotes: Quote[] = [
    { id: "Q-1001", date: "2025-10-27", customer: "CVS", productId: "TRZ-10", productName: "Tirzepatide 10mg Kit", units: 10, unitPrice: 120, landedCost: 80, leadDays: 3, reliability: 0.92, region: "US", status: "paid" },
    { id: "Q-1002", date: "2025-10-28", customer: "MedCore", productId: "TRZ-15", productName: "Tirzepatide 15mg Kit", units: 4, unitPrice: 155, landedCost: 110, leadDays: 5, reliability: 0.9, region: "US", status: "accepted" },
    { id: "Q-1003", date: "2025-10-31", customer: "RejuvLab", productId: "GLOW-70", productName: "GLOW 70mg", units: 20, unitPrice: 165, landedCost: 130, leadDays: 2, reliability: 0.95, region: "US", status: "paid" },
    { id: "Q-1004", date: "2025-10-25", customer: "MedCore", productId: "MOTS-10", productName: "MOTS-C 10mg", units: 30, unitPrice: 90, landedCost: 65, leadDays: 6, reliability: 0.88, region: "CN", status: "paid" },
    { id: "Q-1005", date: "2025-10-23", customer: "Mike", productId: "TRZ-30", productName: "Tirzepatide 30mg Kit", units: 30, unitPrice: 115, landedCost: 95, leadDays: 5, reliability: 0.9, region: "CN", status: "paid" },
    { id: "Q-1006", date: "2025-10-27", customer: "CVS", productId: "RT-30", productName: "Retatrutide 30mg", units: 15, unitPrice: 210, landedCost: 180, leadDays: 7, reliability: 0.85, region: "CN", status: "sent" },
  ];

  const supplierCosts: SupplierCost[] = [
    { supplierId: "SUP-US-01", productId: "TRZ-10", region: "US", unitCost: 70, shippingEst: 6, dutiesEst: 4, reliabilityScore: 95, leadMin: 2, leadMax: 3, moqUnits: 1, effectiveDate: "2025-10-26" },
    { supplierId: "SUP-CN-02", productId: "TRZ-10", region: "CN", unitCost: 55, shippingEst: 10, dutiesEst: 8, reliabilityScore: 88, leadMin: 5, leadMax: 7, moqUnits: 5, effectiveDate: "2025-10-25" },
    { supplierId: "SUP-US-01", productId: "TRZ-15", region: "US", unitCost: 100, shippingEst: 8, dutiesEst: 5, reliabilityScore: 95, leadMin: 3, leadMax: 4, moqUnits: 1, effectiveDate: "2025-10-26" },
    { supplierId: "SUP-US-ELSA", productId: "GLOW-70", region: "US", unitCost: 145, shippingEst: 8, dutiesEst: 0, reliabilityScore: 90, leadMin: 2, leadMax: 3, moqUnits: 1, effectiveDate: "2025-10-28" },
    { supplierId: "SUP-CN-ELSA", productId: "MOTS-10", region: "CN", unitCost: 65, shippingEst: 10, dutiesEst: 0, reliabilityScore: 88, leadMin: 5, leadMax: 6, moqUnits: 10, effectiveDate: "2025-10-25" },
    { supplierId: "SUP-CN-ZHANG", productId: "TRZ-30", region: "CN", unitCost: 90, shippingEst: 4, dutiesEst: 1, reliabilityScore: 90, leadMin: 5, leadMax: 6, moqUnits: 10, effectiveDate: "2025-10-08" },
  ];

  const inventory: InventoryBatch[] = [
    { productId: "TRZ-10", productName: "Tirzepatide 10mg Kit", onHandUnits: 60, velocityBucket: "A", forecast14d: 40 },
    { productId: "TRZ-15", productName: "Tirzepatide 15mg Kit", onHandUnits: 20, velocityBucket: "B", forecast14d: 18 },
    { productId: "TRZ-30", productName: "Tirzepatide 30mg Kit", onHandUnits: 15, velocityBucket: "B", forecast14d: 22 },
    { productId: "GLOW-70", productName: "GLOW 70mg", onHandUnits: 37, velocityBucket: "A", forecast14d: 28 },
    { productId: "MOTS-10", productName: "MOTS-C 10mg", onHandUnits: 30, velocityBucket: "B", forecast14d: 26 },
  ];

  // Aggregates per product
  const productAgg: ProductAggregate[] = Object.values(
    quotes.reduce<Record<string, ProductAggregate>>((acc, q) => {
      const rev = q.units * q.unitPrice;
      const cogs = q.units * q.landedCost;
      if (!acc[q.productId]) {
        acc[q.productId] = {
          productId: q.productId,
          productName: q.productName,
          revenue: 0,
          cogs: 0,
          marginPct: 0,
          units: 0,
          trend: "flat",
        };
      }
      acc[q.productId].revenue += rev;
      acc[q.productId].cogs += cogs;
      acc[q.productId].units += q.units;
      return acc;
    }, {})
  ).map((p) => ({
    ...p,
    marginPct: p.revenue > 0 ? (p.revenue - p.cogs) / p.revenue : 0,
    trend: p.revenue > p.cogs * 1.35 ? "up" : p.revenue < p.cogs * 1.1 ? "down" : "flat",
  }));

  const kpis = {
    totalRevenue: productAgg.reduce((s, p) => s + p.revenue, 0),
    totalCOGS: productAgg.reduce((s, p) => s + p.cogs, 0),
    activeCustomers: new Set(quotes.map((q) => q.customer)).size,
    activeProducts: productAgg.length,
  };
  const profit = kpis.totalRevenue - kpis.totalCOGS;
  const grossMarginPct = kpis.totalRevenue > 0 ? profit / kpis.totalRevenue : 0;

  return { quotes, supplierCosts, inventory, productAgg, kpis, profit, grossMarginPct };
}

// ---------- KPI Card ----------
function KpiCard({ title, value, icon, suffix }: { title: string; value: string; icon: React.ReactNode; suffix?: string }) {
  return (
    <Card className="bg-neutral-900/60 border-neutral-800">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-neutral-300">{title}</CardTitle>
        <div className="text-neutral-400">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-white">{value}{suffix && <span className="text-neutral-400 text-lg ml-1">{suffix}</span>}</div>
      </CardContent>
    </Card>
  );
}

// ---------- Main Component ----------
export default function RexagenPowerhouseDashboard() {
  const [dateRange, setDateRange] = useState<string>("Last 28 days");
  const [sortKey, setSortKey] = useState<"margin" | "revenue" | "units">("margin");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const { quotes, supplierCosts, inventory, productAgg, kpis, profit, grossMarginPct } = useDashboardData(dateRange);

  // Sorting per Rexagen Protocol
  const sortedProducts = useMemo(() => {
    let keyFn: (p: ProductAggregate) => number;
    if (sortKey === "margin") keyFn = (p) => p.marginPct;
    else if (sortKey === "revenue") keyFn = (p) => p.revenue;
    else keyFn = (p) => p.units;
    return sortedBy(productAgg, keyFn, sortDir);
  }, [productAgg, sortKey, sortDir]);

  const supplierRows = useMemo(() => {
    // For a representative product (top product by revenue), compute SourceScore entries
    const top = sortedBy(productAgg, (p) => p.revenue, "desc")[0];
    const costs = supplierCosts.filter((c) => c.productId === (top?.productId ?? ""));
    return costs.map((c) => {
      const landed = c.unitCost + c.shippingEst + c.dutiesEst;
      const lastQuote = quotes.find((q) => q.productId === c.productId);
      const customerPrice = lastQuote ? lastQuote.unitPrice : landed * (1 + BASE_MARGIN_MIN);
      const mScore = clamp01((customerPrice - landed) / customerPrice);
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
  }, [productAgg, supplierCosts, quotes]);

  // Charts data
  const revenueVsCost = useMemo(() => {
    // Aggregate by date for line chart
    const map: Record<string, { date: string; revenue: number; cost: number; marginPct: number }> = {};
    quotes.forEach((q) => {
      const key = q.date;
      if (!map[key]) map[key] = { date: key, revenue: 0, cost: 0, marginPct: 0 };
      map[key].revenue += q.units * q.unitPrice;
      map[key].cost += q.units * q.landedCost;
    });
    const arr = Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
    arr.forEach((row) => (row.marginPct = row.revenue > 0 ? (row.revenue - row.cost) / row.revenue : 0));
    return arr;
  }, [quotes]);

  const marginLeakAlerts = useMemo(() => {
    return quotes
      .map((q) => ({
        ...q,
        m: marginPct(q.unitPrice, q.landedCost),
      }))
      .filter((r) => r.m < 0.25) // leak threshold
      .sort((a, b) => a.m - b.m);
  }, [quotes]);

  const stockRisk = useMemo(() => {
    return inventory
      .map((i) => ({
        ...i,
        risk: i.onHandUnits < i.forecast14d ? "Stockout Risk" : null,
      }))
      .filter((r) => r.risk);
  }, [inventory]);

  return (
    <div className="min-h-screen w-full bg-neutral-950 text-neutral-200">
      {/* Header */}
      <div className="border-b border-neutral-800 bg-neutral-950/80 sticky top-0 z-30 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <Gauge className="h-6 w-6 text-emerald-400" />
          <h1 className="font-black text-xl tracking-tight">Rexagen Sales Ops AI — Powerhouse Dashboard</h1>
          <div className="ml-auto flex items-center gap-2">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px] bg-neutral-900 border-neutral-800">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-900 border-neutral-800">
                <SelectItem value="Last 7 days">Last 7 days</SelectItem>
                <SelectItem value="Last 28 days">Last 28 days</SelectItem>
                <SelectItem value="MTD">Month to date</SelectItem>
                <SelectItem value="QTD">Quarter to date</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="bg-neutral-900 border-neutral-800 hover:bg-neutral-800">
              <RefreshCcw className="h-4 w-4 mr-2" /> Refresh
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-500 text-white">
              <BellRing className="h-4 w-4 mr-2" /> Run Feedback Loop
            </Button>
            <Button className="bg-neutral-800 hover:bg-neutral-700">
              <Activity className="h-4 w-4 mr-2" /> Margin Check
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <KpiCard title="Total Revenue" value={toCurrency(kpis.totalRevenue)} icon={<DollarSign />} />
          <KpiCard title="Total COGS" value={toCurrency(kpis.totalCOGS)} icon={<DollarSign />} />
          <KpiCard title="Gross Margin %" value={(grossMarginPct * 100).toFixed(1)} icon={<Percent />} suffix="%" />
          <KpiCard title="Profit (USD)" value={toCurrency(profit)} icon={<TrendingUp />} />
          <KpiCard title="Active Customers" value={String(kpis.activeCustomers)} icon={<Users />} />
          <KpiCard title="Active Products" value={String(kpis.activeProducts)} icon={<Package />} />
        </div>

        {/* Product Performance */}
        <Card className="bg-neutral-900/60 border-neutral-800">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Product Performance</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-neutral-700 text-neutral-300">Sorted by: {sortKey === "margin" ? "gross_margin_pct" : sortKey}</Badge>
                <Select value={sortKey} onValueChange={(v: any) => setSortKey(v)}>
                  <SelectTrigger className="w-[150px] bg-neutral-900 border-neutral-800">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-neutral-800">
                    <SelectItem value="margin">Highest Margin</SelectItem>
                    <SelectItem value="revenue">Revenue</SelectItem>
                    <SelectItem value="units">Units</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortDir} onValueChange={(v: any) => setSortDir(v)}>
                  <SelectTrigger className="w-[120px] bg-neutral-900 border-neutral-800">
                    <SelectValue placeholder="Dir" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-neutral-800">
                    <SelectItem value="desc">Desc</SelectItem>
                    <SelectItem value="asc">Asc</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sortedProducts.map((p) => ({ name: p.productName, profit: p.revenue - p.cogs }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                    <XAxis dataKey="name" hide />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="profit" name="Profit" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead className="text-neutral-400">
                    <tr className="border-b border-neutral-800">
                      <th className="py-2 text-left">Product</th>
                      <th className="py-2 text-right">Revenue</th>
                      <th className="py-2 text-right">Cost</th>
                      <th className="py-2 text-right">Margin %</th>
                      <th className="py-2 text-right">Units</th>
                      <th className="py-2 text-right">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedProducts.map((p) => (
                      <tr key={p.productId} className="border-b border-neutral-900">
                        <td className="py-2 pr-2">{p.productName}</td>
                        <td className="py-2 text-right">{toCurrency(p.revenue)}</td>
                        <td className="py-2 text-right">{toCurrency(p.cogs)}</td>
                        <td className={`py-2 text-right ${p.marginPct < 0.25 ? "text-red-400" : "text-emerald-400"}`}>{(p.marginPct * 100).toFixed(1)}%</td>
                        <td className="py-2 text-right">{p.units}</td>
                        <td className="py-2 text-right">
                          {p.trend === "up" && <TrendingUp className="inline h-4 w-4 text-emerald-400" />}
                          {p.trend === "down" && <TrendingDown className="inline h-4 w-4 text-red-400" />}
                          {p.trend === "flat" && <Activity className="inline h-4 w-4 text-neutral-400" />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Supplier Optimization (SourceScore) */}
        <Card className="bg-neutral-900/60 border-neutral-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Supplier Optimization — SourceScore</CardTitle>
            <div className="text-xs text-neutral-400">SourceScore = 0.45×Margin + 0.35×Speed + 0.20×Reliability</div>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="text-neutral-400">
                  <tr className="border-b border-neutral-800">
                    <th className="py-2 text-left">Supplier</th>
                    <th className="py-2 text-left">Region</th>
                    <th className="py-2 text-right">Landed Cost</th>
                    <th className="py-2 text-right">Lead</th>
                    <th className="py-2 text-right">Reliability</th>
                    <th className="py-2 text-right">MOQ</th>
                    <th className="py-2 text-right">Effective</th>
                    <th className="py-2 text-right">MarginScore</th>
                    <th className="py-2 text-right">SpeedScore</th>
                    <th className="py-2 text-right">ReliabilityScore</th>
                    <th className="py-2 text-right">SourceScore</th>
                  </tr>
                </thead>
                <tbody>
                  {supplierRows.map((r) => (
                    <tr key={r.supplierId} className="border-b border-neutral-900">
                      <td className="py-2">{r.supplierId}</td>
                      <td className="py-2">{r.region}</td>
                      <td className="py-2 text-right">{toCurrency(r.landedCost)}</td>
                      <td className="py-2 text-right">{r.lead}</td>
                      <td className="py-2 text-right">{r.reliability}</td>
                      <td className="py-2 text-right">{r.moq}</td>
                      <td className="py-2 text-right">{r.effectiveDate}</td>
                      <td className="py-2 text-right">{(r.marginPct * 100).toFixed(1)}%</td>
                      <td className="py-2 text-right">{(r.speedScore * 100).toFixed(0)}%</td>
                      <td className="py-2 text-right">{(r.reliabilityScore * 100).toFixed(0)}%</td>
                      <td className="py-2 text-right font-semibold text-emerald-400">{(r.sourceScore * 100).toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Inventory & Velocity */}
        <Card className="bg-neutral-900/60 border-neutral-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Inventory & Velocity</CardTitle>
            <div className="text-xs text-neutral-400">Velocity Buckets: A ≥ 2/wk, B = 0.5–2/wk, C < 0.5/wk</div>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="text-neutral-400">
                  <tr className="border-b border-neutral-800">
                    <th className="py-2 text-left">Product</th>
                    <th className="py-2 text-right">In Stock</th>
                    <th className="py-2 text-right">14d Forecast</th>
                    <th className="py-2 text-right">Velocity</th>
                    <th className="py-2 text-right">Risk</th>
                    <th className="py-2 text-right">Restock Suggestion</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((i) => {
                    const risk = i.onHandUnits < i.forecast14d;
                    const restockQty = Math.max(0, i.forecast14d * 2 - i.onHandUnits);
                    return (
                      <tr key={i.productId} className="border-b border-neutral-900">
                        <td className="py-2">{i.productName}</td>
                        <td className="py-2 text-right">{i.onHandUnits}</td>
                        <td className="py-2 text-right">{i.forecast14d}</td>
                        <td className="py-2 text-right">{i.velocityBucket}</td>
                        <td className={`py-2 text-right ${risk ? "text-amber-400" : "text-neutral-400"}`}>{risk ? "Stockout Risk" : "OK"}</td>
                        <td className="py-2 text-right">{risk ? `${restockQty} units` : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Trend Analysis & Forecasting */}
        <Card className="bg-neutral-900/60 border-neutral-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Trend Analysis & Forecasting</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueVsCost}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" name="Revenue" />
                    <Line type="monotone" dataKey="cost" name="Cost" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueVsCost}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="marginPct" name="Margin %" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerts & Recommendations */}
        <Card className="bg-neutral-900/60 border-neutral-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Alerts & Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Margin Leaks */}
            {marginLeakAlerts.length > 0 ? (
              <Alert className="bg-amber-950/40 border-amber-800/50">
                <AlertTitle className="flex items-center gap-2"><TrendingDown className="h-4 w-4"/> Margin Leak Detected</AlertTitle>
                <AlertDescription>
                  <div className="text-sm">Quotes with margin &lt; 25% (leak threshold). Sorted by lowest margin first.</div>
                  <div className="mt-2 overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="text-neutral-400">
                        <tr className="border-b border-neutral-800">
                          <th className="py-2 text-left">Quote</th>
                          <th className="py-2 text-left">Product</th>
                          <th className="py-2 text-left">Customer</th>
                          <th className="py-2 text-right">Unit Price</th>
                          <th className="py-2 text-right">Landed Cost</th>
                          <th className="py-2 text-right">Margin %</th>
                          <th className="py-2 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {marginLeakAlerts.map((q) => (
                          <tr key={q.id} className="border-b border-neutral-900">
                            <td className="py-2">{q.id}</td>
                            <td className="py-2">{q.productName}</td>
                            <td className="py-2">{q.customer}</td>
                            <td className="py-2 text-right">{toCurrency(q.unitPrice)}</td>
                            <td className="py-2 text-right">{toCurrency(q.landedCost)}</td>
                            <td className="py-2 text-right text-red-400">{(q.m * 100).toFixed(1)}%</td>
                            <td className="py-2 text-right">
                              <Button size="sm" className="bg-neutral-800 hover:bg-neutral-700">Reprice</Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="bg-emerald-950/40 border-emerald-800/50">
                <AlertTitle className="flex items-center gap-2"><ShieldCheck className="h-4 w-4"/> No Margin Leaks</AlertTitle>
                <AlertDescription className="text-sm">All quotes meet the 25% minimum margin threshold.</AlertDescription>
              </Alert>
            )}

            {/* Stock Risks */}
            {stockRisk.length > 0 && (
              <Alert className="bg-amber-950/40 border-amber-800/50">
                <AlertTitle className="flex items-center gap-2"><Timer className="h-4 w-4"/> Stockout Risks</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-5">
                    {stockRisk.map((r) => (
                      <li key={r.productId} className="text-sm">
                        {r.productName}: In-stock {r.onHandUnits} &lt; 14d forecast {r.forecast14d} — Suggest restock {(r.forecast14d * 2 - r.onHandUnits)} units.
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Weekly Feedback Summary (placeholder) */}
            <Card className="bg-neutral-950/40 border-neutral-800">
              <CardHeader className="pb-1">
                <CardTitle className="text-base">Weekly Feedback Summary</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-neutral-300 space-y-1">
                <div>Top buyers: CVS, MedCore, RejuvLab</div>
                <div>Highest margin: Tirzepatide 10mg</div>
                <div>Restock: 4 kits TRZ-10, 6 kits GLOW 70mg</div>
                <div>Supplier re-eval: Prefer SUP-US-01 for TRZ-10 (faster ETA)</div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        {/* Footer / RUO */}
        <div className="text-xs text-neutral-500 border-t border-neutral-900 pt-4">
          For Research Use Only. Not for human use.
        </div>
      </div>
    </div>
  );
}
