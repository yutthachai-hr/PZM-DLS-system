"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/dal";
import { lineDiff } from "@/lib/calc";
import { DIFF_ALERT, PAYMENT_METHODS, PLATFORMS } from "@/lib/constants";
import { isValidISO, todayISO, toDbDate } from "@/lib/dates";
import { canApprove, canEditReport, canReopen, isAdmin } from "@/lib/permissions";
import { getReport } from "@/lib/reports";

const money = z.coerce.number().min(0, "ห้ามติดลบ").max(99_999_999);
const intNum = z.coerce.number().int().min(0).max(100_000);
const text = (max: number) => z.string().trim().max(max).optional().default("");

const reportSchema = z.object({
  id: z.string().optional(),
  branchId: z.string().optional().default(""),
  date: z.string().refine(isValidISO, "วันที่ไม่ถูกต้อง"),
  billStart: text(40),
  billEnd: text(40),
  float: money,
  note: text(1000),
  chkZReport: z.boolean().default(false),
  chkEdcSlip: z.boolean().default(false),
  chkTransfer: z.boolean().default(false),
  chkPayIn: z.boolean().default(false),
  payments: z
    .array(z.object({ method: z.enum(PAYMENT_METHODS), posAmount: money, countedAmount: money, note: text(200) }))
    .max(PAYMENT_METHODS.length),
  deliveries: z
    .array(
      z.object({
        platform: z.enum(PLATFORMS),
        gross: money,
        net: money,
        orders: intNum,
        cancelledOrders: intNum,
        cancelledAmount: money,
        note: text(200),
      }),
    )
    .max(PLATFORMS.length),
});
export type ReportPayload = z.input<typeof reportSchema>;
type ReportData = z.output<typeof reportSchema>;

export type SaveResult = { ok: true; id: string } | { ok: false; error: string; existingId?: string; field?: string };

type Snapshot = Record<string, string | number | boolean>;

/** Flattens a report into comparable key → value pairs for the audit log. */
function snapshot(r: Omit<ReportData, "date" | "branchId" | "id">): Snapshot {
  const out: Snapshot = {
    billStart: r.billStart,
    billEnd: r.billEnd,
    float: r.float,
    note: r.note,
    chkZReport: r.chkZReport,
    chkEdcSlip: r.chkEdcSlip,
    chkTransfer: r.chkTransfer,
    chkPayIn: r.chkPayIn,
  };
  for (const p of r.payments) {
    out[`${p.method}.pos`] = p.posAmount;
    out[`${p.method}.counted`] = p.countedAmount;
    out[`${p.method}.note`] = p.note;
  }
  for (const d of r.deliveries) {
    for (const f of ["gross", "net", "orders", "cancelledOrders", "cancelledAmount", "note"] as const)
      out[`${d.platform}.${f}`] = d[f];
  }
  return out;
}

function diffSnapshots(a: Snapshot, b: Snapshot) {
  const changes: Record<string, [unknown, unknown]> = {};
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
    if ((a[k] ?? "") !== (b[k] ?? "")) changes[k] = [a[k] ?? null, b[k] ?? null];
  }
  return changes;
}

export async function saveReport(input: ReportPayload, submit: boolean): Promise<SaveResult> {
  const user = await requireUser();
  const parsed = reportSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  const data = parsed.data;

  if (data.date > todayISO()) return { ok: false, error: "บันทึกล่วงหน้าไม่ได้", field: "date" };

  if (submit) {
    const missing = data.payments.find((p) => Math.abs(lineDiff(p)) > DIFF_ALERT && !p.note);
    if (missing)
      return { ok: false, error: `ผลต่างเกิน ${DIFF_ALERT} บาท ใส่หมายเหตุก่อนส่ง`, field: `pay.${missing.method}.note` };
    const badNet = data.deliveries.find((d) => d.net > d.gross);
    if (badNet) return { ok: false, error: "ยอดสุทธิมากกว่ายอดรวม", field: `del.${badNet.platform}.net` };
  }

  const fields = {
    billStart: data.billStart || null,
    billEnd: data.billEnd || null,
    float: data.float,
    note: data.note || null,
    chkZReport: data.chkZReport,
    chkEdcSlip: data.chkEdcSlip,
    chkTransfer: data.chkTransfer,
    chkPayIn: data.chkPayIn,
  };
  const lines = {
    payments: { create: data.payments.map((p) => ({ ...p, note: p.note || null })) },
    deliveries: { create: data.deliveries.map((d) => ({ ...d, note: d.note || null })) },
  };

  // ---- update ----
  if (data.id) {
    const before = await getReport(data.id);
    if (!before) return { ok: false, error: "ไม่พบรายงาน" };
    if (!canEditReport(user, before)) return { ok: false, error: "ไม่มีสิทธิ์แก้ไข" };

    const status = before.status === "DRAFT" && submit ? "SUBMITTED" : before.status;
    const changes = diffSnapshots(snapshot(before), snapshot(data));
    await db.$transaction([
      db.paymentLine.deleteMany({ where: { reportId: data.id } }),
      db.deliveryLine.deleteMany({ where: { reportId: data.id } }),
      db.dailyReport.update({
        where: { id: data.id },
        data: {
          ...fields,
          ...lines,
          status,
          submittedAt: status !== before.status ? new Date() : undefined,
        },
      }),
      db.auditLog.create({
        data: {
          reportId: data.id,
          userId: user.id,
          action: status !== before.status ? "SUBMIT" : "EDIT",
          changes: changes as Prisma.InputJsonValue,
        },
      }),
    ]);
    revalidatePath("/", "layout");
    return { ok: true, id: data.id };
  }

  // ---- create ----
  const branchId = isAdmin(user) ? data.branchId : user.branchId;
  if (!branchId) return { ok: false, error: isAdmin(user) ? "เลือกสาขา" : "บัญชีนี้ยังไม่ผูกสาขา", field: "branchId" };

  const existing = await db.dailyReport.findUnique({
    where: { branchId_date: { branchId, date: toDbDate(data.date) } },
    select: { id: true },
  });
  if (existing) return { ok: false, error: "วันนี้มีรายงานแล้ว", existingId: existing.id };

  try {
    const created = await db.dailyReport.create({
      data: {
        ...fields,
        ...lines,
        branchId,
        date: toDbDate(data.date),
        recorderId: user.id,
        status: submit ? "SUBMITTED" : "DRAFT",
        submittedAt: submit ? new Date() : null,
        auditLogs: { create: { userId: user.id, action: submit ? "CREATE_SUBMIT" : "CREATE" } },
      },
    });
    revalidatePath("/", "layout");
    return { ok: true, id: created.id };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")
      return { ok: false, error: "วันนี้มีรายงานแล้ว" };
    throw e;
  }
}

export async function approveReport(id: string): Promise<SaveResult> {
  const user = await requireUser();
  const r = await getReport(id);
  if (!r || !canApprove(user, r)) return { ok: false, error: "อนุมัติไม่ได้" };
  await db.dailyReport.update({
    where: { id },
    data: {
      status: "APPROVED",
      approvedById: user.id,
      approvedAt: new Date(),
      auditLogs: { create: { userId: user.id, action: "APPROVE" } },
    },
  });
  revalidatePath("/", "layout");
  return { ok: true, id };
}

export async function reopenReport(id: string): Promise<SaveResult> {
  const user = await requireUser();
  const r = await getReport(id);
  if (!r || !canReopen(user, r)) return { ok: false, error: "ปลดล็อกไม่ได้" };
  await db.dailyReport.update({
    where: { id },
    data: {
      status: "SUBMITTED",
      approvedById: null,
      approvedAt: null,
      auditLogs: { create: { userId: user.id, action: "REOPEN" } },
    },
  });
  revalidatePath("/", "layout");
  return { ok: true, id };
}

export async function deleteDraft(id: string): Promise<SaveResult> {
  const user = await requireUser();
  const r = await getReport(id);
  if (!r || r.status !== "DRAFT" || !canEditReport(user, r)) return { ok: false, error: "ลบไม่ได้" };
  await db.dailyReport.delete({ where: { id } });
  revalidatePath("/", "layout");
  return { ok: true, id };
}
