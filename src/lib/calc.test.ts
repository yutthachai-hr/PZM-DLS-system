import { describe, expect, it } from "vitest";
import { cancelRate, feeRate, lineDiff, summarize, type ReportInput } from "./calc";

const report: ReportInput = {
  float: 2000,
  payments: [
    { method: "CASH", posAmount: 12500.5, countedAmount: 12480.5 },
    { method: "QR", posAmount: 8300, countedAmount: 8300 },
    { method: "EDC", posAmount: 4100.25, countedAmount: 4150.25 },
    { method: "COUPON", posAmount: 600, countedAmount: 600 },
  ],
  deliveries: [
    { platform: "GRAB", gross: 9000, net: 6930, orders: 30, cancelledOrders: 2, cancelledAmount: 640 },
    { platform: "LINEMAN", gross: 7000, net: 5390, orders: 22, cancelledOrders: 0, cancelledAmount: 0 },
    { platform: "SHOPEE", gross: 0, net: 0, orders: 0, cancelledOrders: 0, cancelledAmount: 0 },
    { platform: "FOODPANDA_OTHER", gross: 1200.1, net: 960, orders: 4, cancelledOrders: 1, cancelledAmount: 300 },
  ],
};

describe("calc (mirrors Excel formulas)", () => {
  it("E9:E12 diff = counted − POS", () => {
    expect(lineDiff(report.payments[0])).toBe(-20);
    expect(lineDiff(report.payments[2])).toBe(50);
  });

  it("C22 total = Σ POS + Σ delivery gross", () => {
    const s = summarize(report);
    expect(s.inStorePos).toBe(25500.75);
    expect(s.deliveryGross).toBe(17200.1);
    expect(s.totalSales).toBe(42700.85);
  });

  it("C24 cash to deposit = counted cash − float", () => {
    expect(summarize(report).cashToDeposit).toBe(10480.5);
  });

  it("delivery orders, cancellations and fee", () => {
    const s = summarize(report);
    expect(s.orders).toBe(56);
    expect(s.cancelledOrders).toBe(3);
    expect(s.cancelledAmount).toBe(940);
    expect(s.deliveryFee).toBe(3920.1);
    expect(s.cashDiff).toBe(-20);
    expect(s.totalDiff).toBe(30);
  });

  it("rates handle zero", () => {
    expect(cancelRate(0, 0)).toBe(0);
    expect(cancelRate(9, 1)).toBeCloseTo(0.1);
    expect(feeRate(0, 0)).toBe(0);
    expect(feeRate(100, 77)).toBeCloseTo(0.23);
  });

  it("empty report is all zeros", () => {
    const s = summarize({ float: 0, payments: [], deliveries: [] });
    expect(s.totalSales).toBe(0);
    expect(s.cashToDeposit).toBe(0);
  });
});
