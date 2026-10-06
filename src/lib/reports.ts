import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { summarize } from "./calc";
import { PAYMENT_METHODS, PLATFORMS, type PaymentMethodKey, type PlatformKey } from "./constants";
import { fromDbDate, toDbDate } from "./dates";

export const reportInclude = {
  branch: { select: { id: true, name: true, code: true } },
  recorder: { select: { name: true } },
  approvedBy: { select: { name: true } },
  payments: true,
  deliveries: true,
} satisfies Prisma.DailyReportInclude;

type ReportRecord = Prisma.DailyReportGetPayload<{ include: typeof reportInclude }>;

export type PaymentRow = { method: PaymentMethodKey; posAmount: number; countedAmount: number; note: string };
export type DeliveryRow = {
  platform: PlatformKey;
  gross: number;
  net: number;
  orders: number;
  cancelledOrders: number;
  cancelledAmount: number;
  note: string;
};

/** Plain, serialisable report with all 4 payment + 4 platform rows in fixed order. */
export function toView(r: ReportRecord) {
  const payments: PaymentRow[] = PAYMENT_METHODS.map((method) => {
    const p = r.payments.find((x) => x.method === method);
    return { method, posAmount: Number(p?.posAmount ?? 0), countedAmount: Number(p?.countedAmount ?? 0), note: p?.note ?? "" };
  });
  const deliveries: DeliveryRow[] = PLATFORMS.map((platform) => {
    const d = r.deliveries.find((x) => x.platform === platform);
    return {
      platform,
      gross: Number(d?.gross ?? 0),
      net: Number(d?.net ?? 0),
      orders: d?.orders ?? 0,
      cancelledOrders: d?.cancelledOrders ?? 0,
      cancelledAmount: Number(d?.cancelledAmount ?? 0),
      note: d?.note ?? "",
    };
  });
  const float = Number(r.float);
  return {
    id: r.id,
    branchId: r.branchId,
    branchName: r.branch.name,
    branchCode: r.branch.code,
    date: fromDbDate(r.date),
    recorderName: r.recorder.name,
    billStart: r.billStart ?? "",
    billEnd: r.billEnd ?? "",
    float,
    status: r.status,
    chkZReport: r.chkZReport,
    chkEdcSlip: r.chkEdcSlip,
    chkTransfer: r.chkTransfer,
    chkPayIn: r.chkPayIn,
    note: r.note ?? "",
    approvedByName: r.approvedBy?.name ?? null,
    approvedAt: r.approvedAt?.toISOString() ?? null,
    submittedAt: r.submittedAt?.toISOString() ?? null,
    updatedAt: r.updatedAt.toISOString(),
    payments,
    deliveries,
    summary: summarize({ float, payments, deliveries }),
  };
}
export type ReportView = ReturnType<typeof toView>;

export async function getReport(id: string) {
  const r = await db.dailyReport.findUnique({ where: { id }, include: reportInclude });
  return r ? toView(r) : null;
}

export async function listReportsInRange(where: Prisma.DailyReportWhereInput, from: string, to: string) {
  const rows = await db.dailyReport.findMany({
    where: { ...where, date: { gte: toDbDate(from), lte: toDbDate(to) } },
    include: reportInclude,
    orderBy: [{ date: "asc" }, { branch: { name: "asc" } }],
  });
  return rows.map(toView);
}
