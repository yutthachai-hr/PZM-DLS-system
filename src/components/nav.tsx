"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bike, FileDown, History, LayoutDashboard, PlusCircle, Store, Users } from "lucide-react";
import { cx } from "./ui";

const items = [
  { href: "/", label: "แดชบอร์ด", icon: LayoutDashboard },
  { href: "/daily/new", label: "บันทึกยอด", icon: PlusCircle, primary: true },
  { href: "/daily", label: "ประวัติ", icon: History },
  { href: "/delivery", label: "เดลิเวอรี่", icon: Bike },
  { href: "/export", label: "ดึงรายงาน", icon: FileDown },
];
const adminItems = [
  { href: "/admin/branches", label: "สาขา", icon: Store },
  { href: "/admin/users", label: "ผู้ใช้", icon: Users },
];

function isActive(path: string, href: string) {
  if (href === "/") return path === "/";
  if (href === "/daily") return path === "/daily" || (path.startsWith("/daily/") && !path.startsWith("/daily/new"));
  return path.startsWith(href);
}

export function SideNav({ isAdmin }: { isAdmin: boolean }) {
  const path = usePathname();
  const link = (it: (typeof items)[number]) => (
    <Link
      key={it.href}
      href={it.href}
      className={cx(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
        isActive(path, it.href) ? "bg-brand text-white shadow-lg shadow-brand/30" : "text-sidebar-ink/70 hover:bg-white/5 hover:text-sidebar-ink",
      )}
    >
      <it.icon className="size-[18px]" strokeWidth={2} />
      {it.label}
    </Link>
  );
  return (
    <nav className="flex flex-col gap-1">
      {items.map(link)}
      {isAdmin && (
        <>
          <div className="mt-5 mb-1 px-3 text-[11px] font-medium tracking-wider text-sidebar-ink/40 uppercase">Admin</div>
          {adminItems.map(link)}
        </>
      )}
    </nav>
  );
}

export function BottomNav() {
  const path = usePathname();
  const mobile = [items[0], items[2], items[1], items[3], items[4]];
  return (
    <nav className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      <div className="grid grid-cols-5">
        {mobile.map((it) =>
          it.primary ? (
            <Link key={it.href} href={it.href} className="flex flex-col items-center justify-center" aria-label={it.label}>
              <span className="-mt-6 grid size-14 place-items-center rounded-full bg-brand text-white shadow-lg shadow-brand/40 ring-4 ring-bg">
                <it.icon className="size-6" />
              </span>
              <span className="mt-0.5 text-[10px] text-ink-2">{it.label}</span>
            </Link>
          ) : (
            <Link
              key={it.href}
              href={it.href}
              className={cx("flex flex-col items-center gap-0.5 py-2.5 text-[10px]", isActive(path, it.href) ? "text-brand" : "text-muted")}
            >
              <it.icon className="size-5" />
              {it.label}
            </Link>
          ),
        )}
      </div>
    </nav>
  );
}
