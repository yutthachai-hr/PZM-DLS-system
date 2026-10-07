import type { Metadata } from "next";
import { Card, Empty, PageHeader } from "@/components/ui";
import { requireRole } from "@/lib/dal";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/permissions";
import { ApprovalCard } from "./approval-card";

export const metadata: Metadata = { title: "อนุมัติผู้ใช้" };

const when = new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" });

export default async function ApprovalsPage() {
  const me = await requireRole("MANAGER", "ADMIN");
  const admin = isAdmin(me);
  const [pending, branches] = await Promise.all([
    db.user.findMany({
      where: { pending: true, ...(admin ? {} : { branchId: me.branchId ?? "__none__" }) },
      select: { id: true, name: true, phone: true, linePicture: true, branchId: true, createdAt: true, branch: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    }),
    admin ? db.branch.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }) : [],
  ]);

  return (
    <>
      <PageHeader title="อนุมัติผู้ใช้" sub={admin ? "ทุกสาขา" : `เฉพาะสาขา ${me.branch?.name ?? ""}`} />
      {pending.length === 0 ? (
        <Card>
          <Empty>ไม่มีคำขอค้างอยู่</Empty>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {pending.map((u) => (
            <ApprovalCard
              key={u.id}
              user={{ ...u, branchName: u.branch?.name ?? "-", requestedAt: when.format(u.createdAt) }}
              branches={branches}
              canPickRole={admin}
            />
          ))}
        </div>
      )}
    </>
  );
}
