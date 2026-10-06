import clsx from "clsx";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { STATUS_LABEL } from "@/lib/constants";

export const cx = clsx;

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cx("rounded-[var(--radius-card)] border border-line bg-card shadow-[0_1px_2px_rgb(28_25_23/0.04),0_8px_24px_-12px_rgb(28_25_23/0.10)]", className)}
      {...props}
    />
  );
}

export function CardHeader({ title, sub, action }: { title: ReactNode; sub?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 px-5 pt-5">
      <div>
        <h2 className="font-display text-base font-semibold text-ink">{title}</h2>
        {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ title, sub, actions }: { title: ReactNode; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

const btn = {
  base: "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition active:scale-[.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
  size: { sm: "h-9 px-3 text-sm", md: "h-11 px-4 text-sm", lg: "h-12 px-6 text-base" },
  variant: {
    primary: "bg-brand text-white hover:bg-brand-ink shadow-sm shadow-brand/25",
    secondary: "bg-card border border-line text-ink hover:bg-card-2",
    ghost: "text-ink-2 hover:bg-card-2",
    dark: "bg-ink text-bg hover:opacity-90",
    danger: "bg-bad-soft text-bad hover:bg-bad hover:text-white",
  },
};
type BtnProps = { variant?: keyof typeof btn.variant; size?: keyof typeof btn.size };

export function Button({ variant = "primary", size = "md", className, ...props }: ComponentProps<"button"> & BtnProps) {
  return <button className={cx(btn.base, btn.size[size], btn.variant[variant], className)} {...props} />;
}

export function LinkButton({ variant = "primary", size = "md", className, ...props }: ComponentProps<typeof Link> & BtnProps) {
  return <Link className={cx(btn.base, btn.size[size], btn.variant[variant], className)} {...props} />;
}

export function AnchorButton({ variant = "secondary", size = "md", className, ...props }: ComponentProps<"a"> & BtnProps) {
  return <a className={cx(btn.base, btn.size[size], btn.variant[variant], className)} {...props} />;
}

export const inputCls =
  "h-11 w-full rounded-xl border border-line bg-card px-3 text-ink placeholder:text-muted/70 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/15 disabled:opacity-60";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cx(inputCls, className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cx(inputCls, "pr-8", className)} {...props} />;
}

export function Field({ label, hint, children, className }: { label: ReactNode; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <label className={cx("block", className)}>
      <span className="mb-1.5 block text-xs font-medium text-ink-2">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

const statusTone = {
  DRAFT: "bg-cheese-soft text-warn",
  SUBMITTED: "bg-[color-mix(in_oklab,var(--s-delivery)_14%,transparent)] text-[var(--s-delivery)]",
  APPROVED: "bg-good-soft text-good",
} as const;

export function StatusBadge({ status }: { status: keyof typeof STATUS_LABEL }) {
  return (
    <span className={cx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium", statusTone[status])}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="px-5 py-12 text-center text-sm text-muted">{children}</div>;
}

/** Amount with sign + colour for over/short. Colour is never the only cue: sign and icon too. */
export function DiffValue({ value, className }: { value: number; className?: string }) {
  const tone = value < 0 ? "text-bad" : value > 0 ? "text-good" : "text-muted";
  const sign = value > 0 ? "▲ +" : value < 0 ? "▼ −" : "";
  return (
    <span className={cx("num font-medium", tone, className)}>
      {sign}
      {Math.abs(value).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </span>
  );
}
