import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2, FileSpreadsheet, Pencil, Printer } from "lucide-react";
import { ReportActions } from "./report-actions";
import { ReportSheet } from "@/components/report-sheet";
import { AnchorButton, Card, CardHeader, LinkButton, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/dal";
import { db } from "@/lib/db";
import { fmtDateLong } from "@/lib/dates";
import { canApprove, canEditReport, canReopen, canViewBranch } from "@/lib/permissions";
import { getReport } from "@/lib/reports";

export const metadata: Metadata = { title: "รายงาน" };

const ACTION_LABEL: Record<string, string> = {
  CREATE: "สร้างร่าง",
  CREATE_SUBMIT: "สร้าง + ส่ง",
  EDIT: "แก้ไข",
  SUBMIT: "ส่งรายงาน",
  APPROVE: "อนุมัติ",
  REOPEN: "ปลดล็อก",
};

const timeFmt = new Intl.DateTimeFormat("th-TH", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Bangkok" });

export default async function ReportPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const [{ id }, { saved }] = await Promise.all([params, searchParams]);
  const user = await requireUser();
  const r = await getReport(id);
  if (!r || !canViewBranch(user, r.branchId)) notFound();

  const logs = await db.auditLog.findMany({
    where: { reportId: id },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return (
    <>
      <PageHeader
        title={r.branchName}
        sub={fmtDateLong(r.date)}
        actions={
          <>
            <AnchorButton href={`/api/export/excel?id=${r.id}`} size="sm">
              <FileSpreadsheet className="size-4" /> Excel
            </AnchorButton>
            <AnchorButton href={`/daily/${r.id}/print`} target="_blank" size="sm">
              <Printer className="size-4" /> PDF
            </AnchorButton>
            {canEditReport(user, r) && (
              <LinkButton href={`/daily/${r.id}/edit`} variant="dark" size="sm">
                <Pencil className="size-4" /> แก้ไข
              </LinkButton>
            )}
            <ReportActions id={r.id} approve={canApprove(user, r)} reopen={canReopen(user, r)} deletable={r.status === "DRAFT" && canEditReport(user, r)} />
          </>
        }
      />

      {saved && (
        <div className="mb-5 flex items-center gap-2 rounded-2xl bg-good-soft px-4 py-3 text-sm text-good">
          <CheckCircle2 className="size-4" />
          {saved === "submit" ? "ส่งรายงานแล้ว" : "บันทึกร่างแล้ว"}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
        <ReportSheet r={r} />
        <Card className="h-fit">
          <CardHeader title="ประวัติการแก้ไข" />
          <ol className="space-y-4 p-5 text-sm">
            {logs.map((l) => {
              const changes = l.changes && typeof l.changes === "object" ? Object.keys(l.changes) : [];
              return (
                <li key={l.id} className="relative border-l-2 border-line pl-4">
                  <span className="absolute top-1.5 -left-[5px] size-2 rounded-full bg-brand" />
                  <div className="font-medium">
                    {ACTION_LABEL[l.action] ?? l.action} · {l.user.name}
                  </div>
                  <div className="text-xs text-muted">{timeFmt.format(l.createdAt)}</div>
                  {changes.length > 0 && <div className="mt-1 text-xs text-ink-2">{changes.length} ช่อง: {changes.slice(0, 4).join(", ")}{changes.length > 4 ? " …" : ""}</div>}
                </li>
              );
            })}
          </ol>
        </Card>
      </div>
    </>
  );
}
