import "server-only";
import { getCurrentUser } from "./dal";
import { db } from "./db";
import { addDays, daysBetween, isValidISO, todayISO } from "./dates";
import { branchScope } from "./permissions";

const MAX_DAYS = 400;

/** Shared auth + range parsing for export endpoints. */
export async function parseExportRequest(req: Request) {
  const user = await getCurrentUser();
  if (!user) return { error: new Response("Unauthorized", { status: 401 }) } as const;
  const sp = new URL(req.url).searchParams;
  const today = todayISO();
  const to = isValidISO(sp.get("to")) ? sp.get("to")! : today;
  const from = isValidISO(sp.get("from")) ? sp.get("from")! : addDays(to, -6);
  if (from > to || daysBetween(from, to) > MAX_DAYS) return { error: new Response("Bad range", { status: 400 }) } as const;
  const branch = sp.get("branch") || null;
  const scope = branchScope(user, branch);
  const code =
    "branchId" in scope && scope.branchId !== "__none__"
      ? ((await db.branch.findUnique({ where: { id: scope.branchId }, select: { code: true } }))?.code ?? "BRANCH")
      : "ALL";
  return { user, sp, from, to, scope, code } as const;
}

export function xlsxResponse(buf: Buffer, filename: string) {
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
