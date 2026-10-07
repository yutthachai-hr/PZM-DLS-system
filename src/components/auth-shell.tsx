import Image from "next/image";
import type { ReactNode } from "react";

/** Split layout shared by /login and /signup. */
export function AuthShell({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-sidebar p-12 text-sidebar-ink lg:flex lg:flex-col">
        <div
          aria-hidden
          className="absolute -right-40 -bottom-40 size-[560px] rounded-full opacity-90"
          style={{ background: "radial-gradient(circle at 35% 35%, #f5b700 0 18%, #d7261e 19% 62%, #8a1410 63% 100%)" }}
        />
        <div className="relative flex items-center gap-3">
          <Image src="/logo.svg" alt="" width={44} height={44} />
          <span className="font-display text-xl font-bold">
            PIZZA <span className="text-cheese">MANIA</span>
          </span>
        </div>
        <div className="relative mt-auto max-w-sm">
          <h1 className="font-display text-4xl leading-tight font-bold">
            ปิดยอดไว
            <br />
            ไม่ต้องรอ Excel
          </h1>
          <p className="mt-3 text-sm text-sidebar-ink/60">Daily Sales · ทุกสาขา · ทุกช่องทาง</p>
        </div>
      </section>

      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <Image src="/logo.svg" alt="" width={40} height={40} />
            <span className="font-display text-xl font-bold">
              PIZZA <span className="text-brand">MANIA</span>
            </span>
          </div>
          <h2 className="font-display text-2xl font-bold">{title}</h2>
          {sub && <p className="mt-1 mb-6 text-sm text-muted">{sub}</p>}
          {children}
        </div>
      </section>
    </div>
  );
}
