import type { Metadata } from "next";
import Image from "next/image";
import { PrintButton } from "@/components/print-button";
import { totals } from "@/lib/analytics";
import { STATUS_LABEL } from "@/lib/constants";
import { requireUser } from "@/lib/dal";
import { addDays, fmtDate, isValidISO, todayISO } from "@/lib/dates";
import { count, money } from "@/lib/format";
import { branchScope } from "@/lib/permissions";
import { listReportsInRange } from "@/lib/reports";

export const metadata: Metadata = { title: "สรุปยอดขาย" };

type SP = { from?: string; to?: string; branch?: string; status?: string };

export default async function ExportPrintPage({ searchParams }: { searchParams: Promise<SP> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const to = isValidISO(sp.to) ? sp.to : todayISO();
  const from = isValidISO(sp.from) && sp.from <= to ? sp.from : addDays(to, -6);
  const where = {
    ...branchScope(user, sp.branch),
    ...(sp.status === "APPROVED" ? { status: "APPROVED" as const } : sp.status === "SENT" ? { status: { not: "DRAFT" as const } } : {}),
  };
  const reports = (await listReportsInRange(where, from, to)).slice(0, 1000);
  const t = totals(reports);
  const th = "px-2 py-1.5 text-right font-medium";
  const td = "px-2 py-1.5 text-right";

  return (
    <div className="mx-auto max-w-5xl">
      <div className="no-print mb-4 flex items-center justify-between rounded-2xl bg-cheese-soft px-4 py-3 text-sm">
        <span>เลือก “บันทึกเป็น PDF” ในหน้าพิมพ์</span>
        <PrintButton />
      </div>
      <div className="mb-4 flex items-center justify-between border-b-2 border-brand pb-3">
        <div className="flex items-center gap-3">
          <Image src="/logo.svg" alt="" width={36} height={36} />
          <div>
            <div className="font-display text-lg font-bold">สรุปยอดขาย</div>
            <div className="text-xs text-muted">
              {fmtDate(from)} – {fmtDate(to)} · {count(reports.length)} รายงาน
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted">ยอดขายรวม</div>
          <div className="num font-display text-2xl font-semibold">฿{money(t.totalSales)}</div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-[11px]">
          <thead className="border-b border-ink">
            <tr>
              <th className="px-2 py-1.5 text-left font-medium">วันที่</th>
              <th className="px-2 py-1.5 text-left font-medium">สาขา</th>
              <th className={th}>หน้าร้าน</th>
              <th className={th}>เดลิเวอรี่</th>
              <th className={th}>รวม</th>
              <th className={th}>ขาด/เกิน</th>
              <th className={th}>นำฝาก</th>
              <th className={th}>ออเดอร์</th>
              <th className={th}>ยกเลิก</th>
              <th className="px-2 py-1.5 text-left font-medium">สถานะ</th>
            </tr>
          </thead>
          <tbody className="num">
            {reports.map((r) => (
              <tr key={r.id} className="border-b border-line">
                <td className="px-2 py-1.5">{fmtDate(r.date)}</td>
                <td className="px-2 py-1.5">{r.branchName}</td>
                <td className={td}>{money(r.summary.inStorePos)}</td>
                <td className={td}>{money(r.summary.deliveryGross)}</td>
                <td className={`${td} font-semibold`}>{money(r.summary.totalSales)}</td>
                <td className={td}>{money(r.summary.cashDiff)}</td>
                <td className={td}>{money(r.summary.cashToDeposit)}</td>
                <td className={td}>{count(r.summary.orders)}</td>
                <td className={td}>{count(r.summary.cancelledOrders)}</td>
                <td className="px-2 py-1.5">{STATUS_LABEL[r.status]}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="num border-t-2 border-ink font-semibold">
            <tr>
              <td className="px-2 py-2" colSpan={2}>
                รวม
              </td>
              <td className={td}>{money(t.inStore)}</td>
              <td className={td}>{money(t.delivery)}</td>
              <td className={td}>{money(t.totalSales)}</td>
              <td className={td}>{money(t.cashDiff)}</td>
              <td className={td}>{money(t.cashToDeposit)}</td>
              <td className={td}>{count(t.orders)}</td>
              <td className={td}>{count(t.cancelledOrders)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="mt-4 text-[10px] text-muted">
        พิมพ์โดย {user.name} · {new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}
      </p>
    </div>
  );
}
