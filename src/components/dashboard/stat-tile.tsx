import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { Card, cx } from "@/components/ui";

export function StatTile({
  label,
  value,
  sub,
  delta,
  upIsGood = true,
  icon,
  hero = false,
  tone,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  delta?: number | null;
  upIsGood?: boolean;
  icon?: ReactNode;
  hero?: boolean;
  tone?: "good" | "bad";
}) {
  const good = delta == null ? null : delta === 0 ? null : (delta > 0) === upIsGood;
  return (
    <Card className={cx("relative overflow-hidden p-5", hero && "bg-sidebar text-sidebar-ink border-transparent")}>
      {hero && (
        <div
          aria-hidden
          className="absolute -top-16 -right-16 size-48 rounded-full opacity-90"
          style={{ background: "radial-gradient(circle at 40% 40%, #f5b700 0 16%, #d7261e 17% 64%, transparent 65%)" }}
        />
      )}
      <div className="relative flex items-center justify-between">
        <span className={cx("text-sm", hero ? "text-sidebar-ink/70" : "text-ink-2")}>{label}</span>
        {icon && <span className={cx("grid size-8 place-items-center rounded-lg", hero ? "bg-white/10" : "bg-card-2 text-ink-2")}>{icon}</span>}
      </div>
      <div
        className={cx(
          "num relative mt-2 font-display font-semibold tracking-tight",
          hero ? "text-4xl sm:text-5xl" : "text-2xl sm:text-[28px]",
          tone === "good" && "text-good",
          tone === "bad" && "text-bad",
        )}
      >
        {value}
      </div>
      <div className={cx("relative mt-2 flex flex-wrap items-center gap-2 text-xs", hero ? "text-sidebar-ink/60" : "text-muted")}>
        {delta != null && (
          <span
            className={cx(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium",
              good === null ? "bg-card-2 text-ink-2" : good ? "bg-good-soft text-good" : "bg-bad-soft text-bad",
            )}
          >
            {delta >= 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
            {delta >= 0 ? "+" : "−"}
            {Math.abs(delta * 100).toFixed(1)}%
          </span>
        )}
        {sub}
      </div>
    </Card>
  );
}
