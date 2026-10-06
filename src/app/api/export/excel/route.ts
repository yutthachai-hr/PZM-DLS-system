import { buildReportsWorkbook } from "@/lib/excel";
import { parseExportRequest, xlsxResponse } from "@/lib/export-route";
import { canViewBranch } from "@/lib/permissions";
import { getReport, listReportsInRange } from "@/lib/reports";

/** ?id=<reportId> for one day, or ?from&to[&branch][&status] for a range. */
export async function GET(req: Request) {
  const parsed = await parseExportRequest(req);
  if ("error" in parsed) return parsed.error;
  const { user, sp, from, to, scope, code } = parsed;

  const id = sp.get("id");
  if (id) {
    const r = await getReport(id);
    if (!r || !canViewBranch(user, r.branchId)) return new Response("Not found", { status: 404 });
    return xlsxResponse(await buildReportsWorkbook([r]), `DailySales_${r.branchCode}_${r.date}.xlsx`);
  }

  const status = sp.get("status");
  const where = { ...scope, ...(status === "APPROVED" ? { status: "APPROVED" as const } : status === "SENT" ? { status: { not: "DRAFT" as const } } : {}) };
  const reports = await listReportsInRange(where, from, to);
  return xlsxResponse(await buildReportsWorkbook(reports), `DailySales_${code}_${from}_${to}.xlsx`);
}
