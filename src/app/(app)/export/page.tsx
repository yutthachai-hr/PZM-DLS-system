import type { Metadata } from "next";
import { ExportForm } from "./export-form";
import { Card, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/dal";
import { db } from "@/lib/db";
import { addDays, todayISO } from "@/lib/dates";
import { isAdmin } from "@/lib/permissions";

export const metadata: Metadata = { title: "ดึงรายงาน" };

export default async function ExportPage() {
  const user = await requireUser();
  const today = todayISO();
  const branches = isAdmin(user) ? await db.branch.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }) : null;
  return (
    <>
      <PageHeader title="ดึงรายงาน" sub="Excel · PDF" />
      <Card className="max-w-3xl p-6">
        <ExportForm branches={branches} defaultFrom={`${today.slice(0, 8)}01`} defaultTo={today} yesterday={addDays(today, -1)} />
      </Card>
    </>
  );
}
