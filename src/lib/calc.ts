/**
 * Every number on the daily form, dashboard and exports comes from here.
 * Formulas mirror the original Excel sheet:
 *   E9:E12  Diff        = counted − POS
 *   C22     Total sales = Σ POS (in-store) + Σ Gross (delivery)
 *   C24     Cash to deposit = counted cash − float
 */
import type { PaymentMethodKey, PlatformKey } from "./constants";

export type PaymentInput = { method: PaymentMethodKey; posAmount: number; countedAmount: number };
export type DeliveryInput = {
  platform: PlatformKey;
  gross: number;
  net: number;
  orders: number;
  cancelledOrders: number;
  cancelledAmount: number;
};
export type ReportInput = { float: number; payments: PaymentInput[]; deliveries: DeliveryInput[] };

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const sum = <T>(xs: T[], f: (x: T) => number) => round2(xs.reduce((a, x) => a + (f(x) || 0), 0));

export const lineDiff = (p: Pick<PaymentInput, "posAmount" | "countedAmount">) =>
  round2((p.countedAmount || 0) - (p.posAmount || 0));

/** Share of orders that were cancelled: cancelled / (completed + cancelled). */
export const cancelRate = (orders: number, cancelled: number) =>
  orders + cancelled > 0 ? cancelled / (orders + cancelled) : 0;

/** Platform fee/commission share: (gross − net) / gross. */
export const feeRate = (gross: number, net: number) => (gross > 0 ? (gross - net) / gross : 0);

export function summarize(r: ReportInput) {
  const cash = r.payments.find((p) => p.method === "CASH");
  const inStorePos = sum(r.payments, (p) => p.posAmount);
  const inStoreCounted = sum(r.payments, (p) => p.countedAmount);
  const deliveryGross = sum(r.deliveries, (d) => d.gross);
  const deliveryNet = sum(r.deliveries, (d) => d.net);
  const orders = r.deliveries.reduce((a, d) => a + (d.orders || 0), 0);
  const cancelledOrders = r.deliveries.reduce((a, d) => a + (d.cancelledOrders || 0), 0);
  return {
    inStorePos,
    inStoreCounted,
    totalDiff: round2(inStoreCounted - inStorePos),
    cashDiff: cash ? lineDiff(cash) : 0,
    deliveryGross,
    deliveryNet,
    deliveryFee: round2(deliveryGross - deliveryNet),
    cancelledAmount: sum(r.deliveries, (d) => d.cancelledAmount),
    orders,
    cancelledOrders,
    cancelRate: cancelRate(orders, cancelledOrders),
    totalSales: round2(inStorePos + deliveryGross),
    cashToDeposit: round2((cash?.countedAmount || 0) - (r.float || 0)),
  };
}
export type ReportSummary = ReturnType<typeof summarize>;
