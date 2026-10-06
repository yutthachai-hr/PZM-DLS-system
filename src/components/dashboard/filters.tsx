"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { cx, inputCls } from "@/components/ui";

const RANGES = [
  { key: "today", label: "วันนี้" },
  { key: "7d", label: "7 วัน" },
  { key: "30d", label: "30 วัน" },
  { key: "month", label: "เดือนนี้" },
  { key: "custom", label: "กำหนดเอง" },
] as const;

export function RangeFilter({
  range,
  from,
  to,
  branches,
  branch,
}: {
  range: string;
  from: string;
  to: string;
  branches?: { id: string; name: string }[];
  branch?: string;
}) {
  const router = useRouter();
  const path = usePathname();
  const sp = useSearchParams();
  const [pending, start] = useTransition();

  const go = (patch: Record<string, string | undefined>) => {
    const u = new URLSearchParams(sp);
    for (const [k, v] of Object.entries(patch)) {
      if (v) u.set(k, v);
      else u.delete(k);
    }
    start(() => router.replace(`${path}?${u}`, { scroll: false }));
  };

  return (
    <div className="no-print mb-6 flex flex-wrap items-center gap-2">
      <div className="flex rounded-xl border border-line bg-card p-1" role="tablist">
        {RANGES.map((r) => (
          <button
            key={r.key}
            role="tab"
            aria-selected={range === r.key}
            onClick={() => go(r.key === "custom" ? { range: r.key, from, to } : { range: r.key, from: undefined, to: undefined })}
            className={cx(
              "rounded-lg px-3 py-1.5 text-sm transition",
              range === r.key ? "bg-ink text-bg shadow" : "text-ink-2 hover:bg-card-2",
            )}
          >
            {r.label}
          </button>
        ))}
      </div>
      {range === "custom" && (
        <div className="flex items-center gap-2">
          <input type="date" defaultValue={from} max={to} onChange={(e) => e.target.value && go({ from: e.target.value })} className={cx(inputCls, "h-10 w-auto")} aria-label="ตั้งแต่" />
          <span className="text-muted">–</span>
          <input type="date" defaultValue={to} min={from} onChange={(e) => e.target.value && go({ to: e.target.value })} className={cx(inputCls, "h-10 w-auto")} aria-label="ถึง" />
        </div>
      )}
      {branches && (
        <select value={branch ?? ""} onChange={(e) => go({ branch: e.target.value || undefined })} className={cx(inputCls, "h-10 w-auto")} aria-label="สาขา">
          <option value="">ทุกสาขา</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      )}
      {pending && <Loader2 className="size-4 animate-spin text-muted" />}
    </div>
  );
}
