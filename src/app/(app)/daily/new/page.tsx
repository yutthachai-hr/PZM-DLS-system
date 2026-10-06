import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DailyForm } from "@/components/daily-form/daily-form";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/dal";
import { db } from "@/lib/db";
import { fmtDateLong, isValidISO, todayISO, toDbDate } from "@/lib/dates";
import { emptyForm } from "@/lib/form-values";

export const metadata: Metadata = { title: "บันทึกยอด" };

export default async function NewDailyPage({ searchParams }: { searchParams: Promise<{ date?: string; branch?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const today = todayISO();
  const date = isValidISO(sp.date) && sp.date <= today ? sp.date : today;
  const isAdmin = user.role === "ADMIN";

  const branches = await db.branch.findMany({
    where: isAdmin ? { active: true } : { id: user.branchId ?? "__none__" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  const branchId = isAdmin ? (branches.find((b) => b.id === sp.branch)?.id ?? (branches.length === 1 ? branches[0].id : "")) : (user.branchId ?? "");

  // One report per branch per day: jump straight to the existing one.
  if (branchId) {
    const existing = await db.dailyReport.findUnique({
      where: { branchId_date: { branchId, date: toDbDate(date) } },
      select: { id: true },
    });
    if (existing) redirect(`/daily/${existing.id}/edit`);
  }

  return (
    <>
      <PageHeader title="บันทึกยอดขาย" sub={fmtDateLong(date)} />
      <DailyForm initial={emptyForm(branchId, date)} branches={branches} canPickBranch={isAdmin} recorderName={user.name} />
    </>
  );
}
