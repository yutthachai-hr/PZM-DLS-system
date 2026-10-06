import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/print-button";
import { ReportSheet } from "@/components/report-sheet";
import { requireUser } from "@/lib/dal";
import { canViewBranch } from "@/lib/permissions";
import { getReport } from "@/lib/reports";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const r = await getReport((await params).id);
  return { title: r ? `DailySales_${r.branchCode}_${r.date}` : "รายงาน" };
}

/** Print-optimised page — "Save as PDF" from the browser keeps Thai text shaping intact. */
export default async function PrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const r = await getReport(id);
  if (!r || !canViewBranch(user, r.branchId)) notFound();

  return (
    <div className="mx-auto max-w-3xl print:max-w-none">
      <div className="no-print mb-4 flex items-center justify-between rounded-2xl bg-cheese-soft px-4 py-3 text-sm">
        <span>กด “พิมพ์ / PDF” แล้วเลือก “บันทึกเป็น PDF”</span>
        <PrintButton />
      </div>
      <div className="mb-5 flex items-center justify-between border-b-2 border-brand pb-3">
        <div className="flex items-center gap-3">
          <Image src="/logo.svg" alt="" width={40} height={40} />
          <div>
            <div className="font-display text-lg font-bold">PIZZA MANIA</div>
            <div className="text-xs text-muted">Daily Sales Report · รายงานสรุปยอดขายรายวัน</div>
          </div>
        </div>
        <div className="text-right text-xs text-muted">
          พิมพ์โดย {user.name}
          <br />
          {new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}
        </div>
      </div>
      <ReportSheet r={r} print />
      <div className="mt-12 grid grid-cols-2 gap-12 text-center text-sm">
        <div>
          <div className="border-t border-ink pt-2">ผู้บันทึก</div>
        </div>
        <div>
          <div className="border-t border-ink pt-2">ผู้จัดการสาขา</div>
        </div>
      </div>
    </div>
  );
}
