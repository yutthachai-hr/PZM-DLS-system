export const TZ = "Asia/Bangkok";

/** Today's business date in Bangkok as YYYY-MM-DD. */
export function todayISO(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(now);
}

/** YYYY-MM-DD -> Date at UTC midnight (matches Postgres DATE columns). */
export function toDbDate(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

export function fromDbDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDays(iso: string, n: number): string {
  const d = toDbDate(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return fromDbDate(d);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((toDbDate(to).getTime() - toDbDate(from).getTime()) / 86_400_000);
}

export function isValidISO(s: unknown): s is string {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(toDbDate(s).getTime());
}

export type RangeKey = "today" | "7d" | "30d" | "month" | "custom";

export function resolveRange(
  key: string | undefined,
  from?: string,
  to?: string,
  today = todayISO(),
): { key: RangeKey; from: string; to: string } {
  switch (key) {
    case "today":
      return { key, from: today, to: today };
    case "30d":
      return { key, from: addDays(today, -29), to: today };
    case "month":
      return { key, from: `${today.slice(0, 8)}01`, to: today };
    case "custom":
      if (isValidISO(from) && isValidISO(to) && from <= to) return { key, from, to };
      break;
  }
  return { key: "7d", from: addDays(today, -6), to: today };
}

/** Same-length window immediately before [from, to]. */
export function previousRange(from: string, to: string) {
  const len = daysBetween(from, to) + 1;
  return { from: addDays(from, -len), to: addDays(from, -1) };
}

const thDate = new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "2-digit", timeZone: "UTC" });
const thDateLong = new Intl.DateTimeFormat("th-TH", { weekday: "short", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const shortDM = new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", timeZone: "UTC" });

export const fmtDate = (iso: string) => thDate.format(toDbDate(iso));
export const fmtDateLong = (iso: string) => thDateLong.format(toDbDate(iso));
export const fmtDayMonth = (iso: string) => shortDM.format(toDbDate(iso));
