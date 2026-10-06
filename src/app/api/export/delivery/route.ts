import { buildDeliveryWorkbook } from "@/lib/excel";
import { parseExportRequest, xlsxResponse } from "@/lib/export-route";
import { listReportsInRange } from "@/lib/reports";

export async function GET(req: Request) {
  const parsed = await parseExportRequest(req);
  if ("error" in parsed) return parsed.error;
  const { from, to, scope, code } = parsed;
  const reports = await listReportsInRange(scope, from, to);
  return xlsxResponse(await buildDeliveryWorkbook(reports, from, to), `Delivery_${code}_${from}_${to}.xlsx`);
}
