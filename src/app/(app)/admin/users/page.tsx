import type { Metadata } from "next";
import { UserForm } from "./user-form";
import { Card, PageHeader, cx } from "@/components/ui";
import { ROLE_LABEL } from "@/lib/constants";
import { requireRole } from "@/lib/dal";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "ผู้ใช้" };

export default async function UsersPage() {
  const me = await requireRole("ADMIN");
  const [users, branches] = await Promise.all([
    db.user.findMany({
      orderBy: [{ active: "desc" }, { role: "desc" }, { name: "asc" }],
      select: { id: true, name: true, username: true, role: true, branchId: true, active: true, branch: { select: { name: true } } },
    }),
    db.branch.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <>
      <PageHeader title="ผู้ใช้" sub={`${users.length} บัญชี`} />
      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <Card className="h-fit p-5">
          <h2 className="mb-4 font-display font-semibold">เพิ่มผู้ใช้</h2>
          <UserForm branches={branches} />
        </Card>
        <div className="space-y-3">
          {users.map((u) => (
            <Card key={u.id} className={cx("p-0", !u.active && "opacity-60")}>
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4">
                  <div className="grid size-10 place-items-center rounded-full bg-cheese-soft font-display font-semibold text-warn">{u.name.slice(0, 1)}</div>
                  <div className="flex-1">
                    <div className="font-medium">
                      {u.name} {u.id === me.id && <span className="text-xs text-muted">(คุณ)</span>}
                    </div>
                    <div className="text-xs text-muted">
                      @{u.username} · {ROLE_LABEL[u.role]} · {u.branch?.name ?? "ทุกสาขา"}
                      {!u.active && " · ปิดใช้งาน"}
                    </div>
                  </div>
                  <span className="text-xs text-brand group-open:hidden">แก้ไข</span>
                </summary>
                <div className="border-t border-line p-5">
                  <UserForm branches={branches} user={u} />
                </div>
              </details>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
