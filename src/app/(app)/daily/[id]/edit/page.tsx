import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { DailyForm } from "@/components/daily-form/daily-form";
import { LinkButton, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/dal";
import { fmtDateLong } from "@/lib/dates";
import { reportToForm } from "@/lib/form-values";
import { canEditReport, canViewBranch } from "@/lib/permissions";
import { getReport } from "@/lib/reports";

export const metadata: Metadata = { title: "แก้ไขยอด" };

export default async function EditDailyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const report = await getReport(id);
  if (!report || !canViewBranch(user, report.branchId)) notFound();
  if (!canEditReport(user, report)) redirect(`/daily/${id}`);

  return (
    <>
      <PageHeader
        title="แก้ไขยอดขาย"
        sub={`${report.branchName} · ${fmtDateLong(report.date)}`}
        actions={
          <LinkButton href={`/daily/${id}`} variant="secondary" size="sm">
            ดูรายงาน
          </LinkButton>
        }
      />
      <DailyForm
        initial={reportToForm(report)}
        branches={[{ id: report.branchId, name: report.branchName }]}
        canPickBranch={false}
        recorderName={report.recorderName}
        status={report.status}
      />
    </>
  );
}
