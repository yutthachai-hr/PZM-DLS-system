import type { Metadata } from "next";
import { BranchForm } from "./branch-form";
import { Card, PageHeader } from "@/components/ui";
import { requireRole } from "@/lib/dal";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "สาขา" };

export default async function BranchesPage() {
  await requireRole("ADMIN");
  const branches = await db.branch.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { users: true, reports: true } } },
  });
  return (
    <>
      <PageHeader title="สาขา" sub={`${branches.length} สาขา`} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 font-display font-semibold">เพิ่มสาขา</h2>
          <BranchForm />
        </Card>
        {branches.map((b) => (
          <Card key={b.id} className="p-5">
            <div className="mb-4 flex items-center justify-between text-xs text-muted">
              <span>
                {b._count.users} ผู้ใช้ · {b._count.reports} รายงาน
              </span>
            </div>
            <BranchForm branch={b} />
          </Card>
        ))}
      </div>
    </>
  );
}
