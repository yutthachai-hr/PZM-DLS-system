import Image from "next/image";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { BottomNav, SideNav } from "@/components/nav";
import { requireUser } from "@/lib/dal";
import { db } from "@/lib/db";
import { isAdmin, isManagerUp } from "@/lib/permissions";
import { ROLE_LABEL } from "@/lib/constants";

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <Image src="/logo.svg" alt="" width={compact ? 32 : 40} height={compact ? 32 : 40} priority />
      <div className="leading-none">
        <div className="font-display text-lg font-bold tracking-tight whitespace-nowrap">
          PIZZA <span className="text-cheese">MANIA</span>
        </div>
        {!compact && <div className="mt-1 text-[11px] tracking-wide opacity-60">Daily Sales</div>}
      </div>
    </div>
  );
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const initials = user.name.trim().slice(0, 1);
  const pendingCount = isManagerUp(user)
    ? await db.user.count({ where: { pending: true, ...(isAdmin(user) ? {} : { branchId: user.branchId ?? "__none__" }) } })
    : 0;

  const account = (
    <div className="flex items-center gap-3">
      <Link href="/profile" className="flex min-w-0 flex-1 items-center gap-3 rounded-lg transition hover:opacity-80" title="โปรไฟล์">
        {user.linePicture ? (
          // eslint-disable-next-line @next/next/no-img-element -- LINE CDN avatar
          <img src={user.linePicture} alt="" className="size-9 shrink-0 rounded-full" />
        ) : (
          <div className="grid size-9 shrink-0 place-items-center rounded-full bg-cheese font-display font-bold text-ink">{initials}</div>
        )}
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-sm font-bold">{user.name}</div>
          <div className="truncate text-xs opacity-60">
            {ROLE_LABEL[user.role]}
            {user.branch ? ` · ${user.branch.name}` : " · ทุกสาขา"}
          </div>
        </div>
      </Link>
      <form action={logout}>
        <button className="grid size-9 place-items-center rounded-lg opacity-60 transition hover:bg-white/10 hover:opacity-100" title="ออกจากระบบ" aria-label="ออกจากระบบ">
          <LogOut className="size-4" />
        </button>
      </form>
    </div>
  );

  return (
    <div className="min-h-dvh lg:pl-64">
      {/* desktop sidebar */}
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-sidebar p-4 text-sidebar-ink lg:flex">
        <div className="px-2 pt-2 pb-8">
          <Brand />
        </div>
        <SideNav isAdmin={isAdmin(user)} isManager={isManagerUp(user)} pendingCount={pendingCount} />
        <div className="mt-auto rounded-2xl bg-white/5 p-3">{account}</div>
      </aside>

      {/* mobile top bar */}
      <header className="no-print sticky top-0 z-30 flex items-center justify-between bg-sidebar px-4 py-3 text-sidebar-ink lg:hidden">
        <Brand compact />
        <div className="max-w-[60%]">{account}</div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pt-6 pb-28 sm:px-6 lg:px-8 lg:pt-8 lg:pb-12">
        {pendingCount > 0 && (
          <Link
            href="/approvals"
            className="no-print mb-5 flex items-center justify-between rounded-2xl bg-cheese-soft px-4 py-3 text-sm text-warn lg:hidden"
          >
            <span>มีคำขอใช้งานรออนุมัติ {pendingCount} คน</span>
            <span className="font-bold">ดู →</span>
          </Link>
        )}
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
