import type { ReactNode } from "react";
import { cx } from "./ui";

function LineLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <path
        fill="currentColor"
        d="M12 3C6.48 3 2 6.6 2 11.03c0 3.97 3.55 7.3 8.35 7.93.33.07.77.22.88.5.1.25.07.65.03.9l-.14.85c-.04.25-.2.98.86.53 1.06-.44 5.72-3.37 7.8-5.77C21.27 14.4 22 12.8 22 11.03 22 6.6 17.52 3 12 3Zm-3.6 10.4H6.4a.53.53 0 0 1-.53-.53V8.9a.53.53 0 1 1 1.06 0v3.44H8.4a.53.53 0 1 1 0 1.06Zm2.06-.53a.53.53 0 1 1-1.06 0V8.9a.53.53 0 1 1 1.06 0v3.97Zm4.8 0c0 .23-.15.43-.37.5a.52.52 0 0 1-.59-.18l-2.03-2.77v2.45a.53.53 0 1 1-1.06 0V8.9a.53.53 0 0 1 .95-.32l2.04 2.77V8.9a.53.53 0 1 1 1.06 0v3.97Zm3.2-2.52a.53.53 0 1 1 0 1.06h-1.47v.94h1.47a.53.53 0 1 1 0 1.06h-2a.53.53 0 0 1-.53-.53V8.9c0-.29.24-.53.53-.53h2a.53.53 0 1 1 0 1.06h-1.47v.92h1.47Z"
      />
    </svg>
  );
}

/** LINE-branded button (green #06C755, per LINE Login button guidelines). Plain <a> — it leaves the app for LINE. */
export function LineButton({ href, children, disabled }: { href: string; children: ReactNode; disabled?: boolean }) {
  if (disabled)
    return (
      <div className="rounded-xl border border-dashed border-line px-4 py-3 text-center text-sm text-muted">
        LINE Login ยังไม่ได้ตั้งค่า (LINE_CHANNEL_ID)
      </div>
    );
  return (
    <a
      href={href}
      className={cx(
        "flex h-12 w-full items-center justify-center gap-2.5 rounded-xl bg-[#06c755] px-4 font-bold text-white shadow-sm transition",
        "hover:bg-[#05b34c] active:scale-[.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#06c755]",
      )}
    >
      <LineLogo className="size-6" />
      {children}
    </a>
  );
}
