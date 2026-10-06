import { cancelRate, round2 } from "./calc";
import { PLATFORMS, type PlatformKey } from "./constants";
import { addDays, daysBetween } from "./dates";
import type { ReportView } from "./reports";

export type Totals = {
  reports: number;
  totalSales: number;
  inStore: number;
  delivery: number;
  deliveryNet: number;
  cashDiff: number;
  totalDiff: number;
  orders: number;
  cancelledOrders: number;
  cancelledAmount: number;
  cancelRate: number;
  cashToDeposit: number;
};

export function totals(rs: ReportView[]): Totals {
  const t = rs.reduce(
    (a, r) => {
      const s = r.summary;
      a.totalSales += s.totalSales;
      a.inStore += s.inStorePos;
      a.delivery += s.deliveryGross;
      a.deliveryNet += s.deliveryNet;
      a.cashDiff += s.cashDiff;
      a.totalDiff += s.totalDiff;
      a.orders += s.orders;
      a.cancelledOrders += s.cancelledOrders;
      a.cancelledAmount += s.cancelledAmount;
      a.cashToDeposit += s.cashToDeposit;
      return a;
    },
    { totalSales: 0, inStore: 0, delivery: 0, deliveryNet: 0, cashDiff: 0, totalDiff: 0, orders: 0, cancelledOrders: 0, cancelledAmount: 0, cashToDeposit: 0 },
  );
  const r = Object.fromEntries(Object.entries(t).map(([k, v]) => [k, round2(v)])) as typeof t;
  return { ...r, reports: rs.length, cancelRate: cancelRate(r.orders, r.cancelledOrders) };
}

export type DayPoint = { date: string; inStore: number; delivery: number; total: number; reports: number };

/** One point per calendar day in [from, to], zero-filled. */
export function dailySeries(rs: ReportView[], from: string, to: string): DayPoint[] {
  const map = new Map<string, DayPoint>();
  for (let i = 0; i <= daysBetween(from, to); i++) {
    const d = addDays(from, i);
    map.set(d, { date: d, inStore: 0, delivery: 0, total: 0, reports: 0 });
  }
  for (const r of rs) {
    const p = map.get(r.date);
    if (!p) continue;
    p.inStore = round2(p.inStore + r.summary.inStorePos);
    p.delivery = round2(p.delivery + r.summary.deliveryGross);
    p.total = round2(p.total + r.summary.totalSales);
    p.reports++;
  }
  return [...map.values()];
}

export type PlatformTotals = {
  platform: PlatformKey;
  gross: number;
  net: number;
  orders: number;
  cancelledOrders: number;
  cancelledAmount: number;
  cancelRate: number;
  feeRate: number;
  avgTicket: number;
};

export function platformTotals(rs: ReportView[]): PlatformTotals[] {
  return PLATFORMS.map((platform) => {
    const a = { gross: 0, net: 0, orders: 0, cancelledOrders: 0, cancelledAmount: 0 };
    for (const r of rs) {
      const d = r.deliveries.find((x) => x.platform === platform);
      if (!d) continue;
      a.gross += d.gross;
      a.net += d.net;
      a.orders += d.orders;
      a.cancelledOrders += d.cancelledOrders;
      a.cancelledAmount += d.cancelledAmount;
    }
    return {
      platform,
      gross: round2(a.gross),
      net: round2(a.net),
      orders: a.orders,
      cancelledOrders: a.cancelledOrders,
      cancelledAmount: round2(a.cancelledAmount),
      cancelRate: cancelRate(a.orders, a.cancelledOrders),
      feeRate: a.gross > 0 ? (a.gross - a.net) / a.gross : 0,
      avgTicket: a.orders > 0 ? a.gross / a.orders : 0,
    };
  });
}

export type PlatformDay = { date: string } & Record<PlatformKey, { gross: number; orders: number; cancelledOrders: number }>;

export function platformDaily(rs: ReportView[], from: string, to: string): PlatformDay[] {
  const out: PlatformDay[] = [];
  for (let i = 0; i <= daysBetween(from, to); i++) {
    const date = addDays(from, i);
    const day = { date } as PlatformDay;
    for (const p of PLATFORMS) day[p] = { gross: 0, orders: 0, cancelledOrders: 0 };
    for (const r of rs) {
      if (r.date !== date) continue;
      for (const d of r.deliveries) {
        day[d.platform].gross = round2(day[d.platform].gross + d.gross);
        day[d.platform].orders += d.orders;
        day[d.platform].cancelledOrders += d.cancelledOrders;
      }
    }
    out.push(day);
  }
  return out;
}

export function byBranch(rs: ReportView[]) {
  const groups = new Map<string, { branchId: string; branchName: string; reports: ReportView[] }>();
  for (const r of rs) {
    const g = groups.get(r.branchId) ?? { branchId: r.branchId, branchName: r.branchName, reports: [] };
    g.reports.push(r);
    groups.set(r.branchId, g);
  }
  return [...groups.values()].map((g) => ({ ...g, totals: totals(g.reports) })).sort((a, b) => b.totals.totalSales - a.totals.totalSales);
}

/** Relative change; null when there is no baseline. */
export const delta = (now: number, prev: number) => (prev ? (now - prev) / Math.abs(prev) : null);
