import type { FormValues } from "@/components/daily-form/fields";
import { PAYMENT_METHODS, PLATFORMS } from "./constants";
import type { ReportView } from "./reports";

const s = (n: number) => (n ? String(n) : "");

export function emptyForm(branchId: string, date: string): FormValues {
  return {
    branchId,
    date,
    billStart: "",
    billEnd: "",
    float: "",
    note: "",
    chkZReport: false,
    chkEdcSlip: false,
    chkTransfer: false,
    chkPayIn: false,
    payments: PAYMENT_METHODS.map((method) => ({ method, posAmount: "", countedAmount: "", note: "" })),
    deliveries: PLATFORMS.map((platform) => ({
      platform,
      gross: "",
      net: "",
      orders: "",
      cancelledOrders: "",
      cancelledAmount: "",
      note: "",
    })),
  };
}

export function reportToForm(r: ReportView): FormValues {
  return {
    id: r.id,
    branchId: r.branchId,
    date: r.date,
    billStart: r.billStart,
    billEnd: r.billEnd,
    float: s(r.float),
    note: r.note,
    chkZReport: r.chkZReport,
    chkEdcSlip: r.chkEdcSlip,
    chkTransfer: r.chkTransfer,
    chkPayIn: r.chkPayIn,
    payments: r.payments.map((p) => ({ ...p, posAmount: s(p.posAmount), countedAmount: s(p.countedAmount) })),
    deliveries: r.deliveries.map((d) => ({
      ...d,
      gross: s(d.gross),
      net: s(d.net),
      orders: s(d.orders),
      cancelledOrders: s(d.cancelledOrders),
      cancelledAmount: s(d.cancelledAmount),
    })),
  };
}
