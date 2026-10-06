import "server-only";
import ExcelJS from "exceljs";
import { PAYMENT_LABEL, PLATFORMS, PLATFORM_LABEL, STATUS_LABEL } from "./constants";
import { cancelRate } from "./calc";
import { platformDaily } from "./analytics";
import type { ReportView } from "./reports";

const RED = "FFD7261E";
const CREAM = "FFFFF8F0";
const INK = "FF1C1917";
const FONT = "Tahoma";
const THB = '_("฿"* #,##0.00_);_("฿"* \\(#,##0.00\\);_("฿"* "-"??_);_(@_)';
const INT = "#,##0";

const thin = { style: "thin" as const, color: { argb: "FFE5DED4" } };
const border = { top: thin, left: thin, bottom: thin, right: thin };

function header(cell: ExcelJS.Cell, value: string) {
  cell.value = value;
  cell.font = { name: FONT, size: 11, bold: true, color: { argb: "FFFFFFFF" } };
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: RED } };
  cell.alignment = { horizontal: "center", vertical: "middle" };
  cell.border = border;
}

function body(cell: ExcelJS.Cell, value: ExcelJS.CellValue, numFmt?: string) {
  cell.value = value;
  cell.font = { name: FONT, size: 10, color: { argb: INK } };
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CREAM } };
  cell.border = border;
  if (numFmt) cell.numFmt = numFmt;
}

const toDate = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

/** Same cell layout as the original "Daily Sales Report" sheet (B2:F25), plus cancel columns G:H. */
export function writeDailySheet(ws: ExcelJS.Worksheet, r: ReportView) {
  ws.columns = [{ width: 2.75 }, { width: 26 }, { width: 16 }, { width: 18 }, { width: 16 }, { width: 22 }, { width: 14 }, { width: 14 }];
  ws.views = [{ showGridLines: false }];
  ws.pageSetup = { paperSize: 9, orientation: "portrait", fitToPage: true, fitToWidth: 1, fitToHeight: 1 };

  ws.mergeCells("B2:F2");
  const title = ws.getCell("B2");
  title.value = "Daily Sales Report (รายงานสรุปยอดขายรายวัน)";
  title.font = { name: FONT, size: 20, bold: true, color: { argb: RED } };
  title.alignment = { horizontal: "center" };
  ws.getRow(2).height = 34;

  const label = (addr: string, v: string) => {
    const c = ws.getCell(addr);
    c.value = v;
    c.font = { name: FONT, size: 10, bold: true, color: { argb: INK } };
  };
  const val = (addr: string, v: ExcelJS.CellValue, fmt?: string) => {
    const c = ws.getCell(addr);
    c.value = v;
    c.font = { name: FONT, size: 10, color: { argb: INK } };
    if (fmt) c.numFmt = fmt;
  };
  label("B4", "วันที่ (Date):");
  val("C4", toDate(r.date), "d/M/yyyy");
  label("D4", "สาขา (Branch):");
  val("E4", r.branchName);
  label("B5", "ผู้บันทึก (Recorder):");
  val("C5", r.recorderName);
  label("D5", "เลขที่บิลเริ่ม-สิ้นสุด:");
  val("E5", r.billStart || r.billEnd ? `${r.billStart} - ${r.billEnd}` : "");

  // 1. In-store
  ws.mergeCells("B7:F7");
  header(ws.getCell("B7"), "1. ยอดขายหน้าร้าน (In-Store Sales)");
  ["ช่องทางชำระเงิน", "ยอด POS", "ยอดนับจริง", "ผลต่าง (Diff)", "หมายเหตุ"].forEach((h, i) => header(ws.getRow(8).getCell(2 + i), h));
  r.payments.forEach((p, i) => {
    const row = 9 + i;
    body(ws.getCell(`B${row}`), PAYMENT_LABEL[p.method].th);
    body(ws.getCell(`C${row}`), p.posAmount, THB);
    body(ws.getCell(`D${row}`), p.countedAmount, THB);
    body(ws.getCell(`E${row}`), { formula: `D${row}-C${row}`, result: p.countedAmount - p.posAmount }, THB);
    body(ws.getCell(`F${row}`), p.note);
  });

  // 2. Delivery
  ws.mergeCells("B14:H14");
  header(ws.getCell("B14"), "2. ยอดขายเดลิเวอรี่ (Delivery Sales)");
  ["แพลตฟอร์ม", "ยอดรวม (Gross)", "ยอดสุทธิ (Net)", "จำนวนออเดอร์", "หมายเหตุ", "ยกเลิก (ออเดอร์)", "ยอดยกเลิก"].forEach((h, i) =>
    header(ws.getRow(15).getCell(2 + i), h),
  );
  r.deliveries.forEach((d, i) => {
    const row = 16 + i;
    body(ws.getCell(`B${row}`), PLATFORM_LABEL[d.platform]);
    body(ws.getCell(`C${row}`), d.gross, THB);
    body(ws.getCell(`D${row}`), d.net, THB);
    body(ws.getCell(`E${row}`), d.orders, INT);
    body(ws.getCell(`F${row}`), d.note);
    body(ws.getCell(`G${row}`), d.cancelledOrders, INT);
    body(ws.getCell(`H${row}`), d.cancelledAmount, THB);
  });

  // 3. Summary & checklist
  const s = r.summary;
  ws.mergeCells("B21:F21");
  header(ws.getCell("B21"), "3. สรุปภาพรวมสิ้นวัน (Daily Summary & Checklist)");
  body(ws.getCell("B22"), "ยอดขายรวมทั้งหมด (Total Sales)");
  body(ws.getCell("C22"), { formula: "SUM(C9:C12)+SUM(C16:C19)", result: s.totalSales }, THB);
  ws.getCell("C22").font = { name: FONT, size: 11, bold: true, color: { argb: RED } };
  body(ws.getCell("B23"), "เงินทอนสำรอง (Float)");
  body(ws.getCell("C23"), r.float, THB);
  body(ws.getCell("B24"), "เงินสดนำฝาก (Cash to Deposit)");
  body(ws.getCell("C24"), { formula: "D9-C23", result: s.cashToDeposit }, THB);
  ws.mergeCells("D22:D25");
  const chk = ws.getCell("D22");
  chk.value = "Checklist ตรวจสอบเอกสาร";
  chk.font = { name: FONT, size: 10, bold: true, color: { argb: INK } };
  chk.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  chk.border = border;
  (
    [
      ["Z-Report", r.chkZReport],
      ["สลิป EDC", r.chkEdcSlip],
      ["สลิปโอนเงิน", r.chkTransfer],
      ["Pay-in Slip", r.chkPayIn],
    ] as const
  ).forEach(([name, ok], i) => {
    body(ws.getCell(`E${22 + i}`), name);
    body(ws.getCell(`F${22 + i}`), ok ? "✓ ครบ" : "✗ ไม่ครบ");
    ws.getCell(`F${22 + i}`).font = { name: FONT, size: 10, bold: true, color: { argb: ok ? "FF2F855A" : "FFC81E1E" } };
  });

  label("B27", "สถานะ:");
  val("C27", STATUS_LABEL[r.status] + (r.approvedByName ? ` (อนุมัติโดย ${r.approvedByName})` : ""));
  if (r.note) {
    label("B28", "หมายเหตุ:");
    ws.mergeCells("C28:H28");
    val("C28", r.note);
    ws.getCell("C28").alignment = { wrapText: true, vertical: "top" };
  }
}

function sheetName(r: ReportView, multiBranch: boolean, used: Set<string>) {
  const [y, m, d] = r.date.split("-");
  const base = `${d}-${m}-${y}${multiBranch ? ` ${r.branchCode}` : ""}`.slice(0, 31);
  let name = base;
  for (let i = 2; used.has(name); i++) name = `${base.slice(0, 27)} (${i})`;
  used.add(name);
  return name;
}

/** Summary sheet (one row per report) followed by one original-layout sheet per day. */
export async function buildReportsWorkbook(reports: ReportView[]) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Pizza Mania Daily Sales";
  wb.created = new Date();

  const sum = wb.addWorksheet("สรุป", { views: [{ state: "frozen", ySplit: 1 }] });
  const cols: [string, number, string?][] = [
    ["วันที่", 12, "d/M/yyyy"],
    ["สาขา", 18],
    ["ผู้บันทึก", 18],
    ["สถานะ", 10],
    ["เงินสด POS", 14, THB],
    ["QR/โอน POS", 14, THB],
    ["EDC POS", 14, THB],
    ["คูปอง POS", 14, THB],
    ["รวมหน้าร้าน", 15, THB],
    ["ผลต่างเงินสด", 14, THB],
    ["Grab", 14, THB],
    ["LINE MAN", 14, THB],
    ["Shopee", 14, THB],
    ["อื่นๆ", 14, THB],
    ["รวมเดลิเวอรี่", 15, THB],
    ["สุทธิเดลิเวอรี่", 15, THB],
    ["ออเดอร์", 10, INT],
    ["ยกเลิก", 10, INT],
    ["ยอดยกเลิก", 13, THB],
    ["ยอดขายรวม", 16, THB],
    ["Float", 12, THB],
    ["นำฝาก", 14, THB],
  ];
  sum.columns = cols.map(([h, w]) => ({ header: h, width: w }));
  sum.getRow(1).eachCell((c) => header(c, String(c.value)));
  for (const r of reports) {
    const s = r.summary;
    const pay = (m: string) => r.payments.find((p) => p.method === m)?.posAmount ?? 0;
    const del = (p: string) => r.deliveries.find((d) => d.platform === p)?.gross ?? 0;
    const row = sum.addRow([
      toDate(r.date),
      r.branchName,
      r.recorderName,
      STATUS_LABEL[r.status],
      pay("CASH"),
      pay("QR"),
      pay("EDC"),
      pay("COUPON"),
      s.inStorePos,
      s.cashDiff,
      del("GRAB"),
      del("LINEMAN"),
      del("SHOPEE"),
      del("FOODPANDA_OTHER"),
      s.deliveryGross,
      s.deliveryNet,
      s.orders,
      s.cancelledOrders,
      s.cancelledAmount,
      s.totalSales,
      r.float,
      s.cashToDeposit,
    ]);
    row.eachCell((c, i) => {
      c.font = { name: FONT, size: 10 };
      c.border = border;
      const fmt = cols[i - 1][2];
      if (fmt) c.numFmt = fmt;
    });
  }
  if (reports.length) {
    const last = reports.length + 1;
    const total = sum.addRow(["รวม"]);
    for (let i = 5; i <= cols.length; i++) {
      if (i === 21) continue; // float isn't additive
      const col = sum.getColumn(i).letter;
      total.getCell(i).value = { formula: `SUM(${col}2:${col}${last})` };
      total.getCell(i).numFmt = cols[i - 1][2] ?? "";
    }
    total.eachCell((c) => {
      c.font = { name: FONT, size: 10, bold: true };
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CREAM } };
      c.border = border;
    });
  }
  sum.autoFilter = { from: "A1", to: { row: 1, column: cols.length } };

  const multiBranch = new Set(reports.map((r) => r.branchId)).size > 1;
  const used = new Set<string>(["สรุป"]);
  for (const r of reports) writeDailySheet(wb.addWorksheet(sheetName(r, multiBranch, used)), r);

  return Buffer.from(await wb.xlsx.writeBuffer());
}

/** Delivery-only workbook: per-day platform figures + totals. */
export async function buildDeliveryWorkbook(reports: ReportView[], from: string, to: string) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Pizza Mania Daily Sales";
  const ws = wb.addWorksheet("เดลิเวอรี่", { views: [{ state: "frozen", ySplit: 2, xSplit: 1 }] });
  ws.getColumn(1).width = 12;

  ws.getCell(1, 1).value = "วันที่";
  ws.mergeCells(1, 1, 2, 1);
  header(ws.getCell(1, 1), "วันที่");
  const sub = ["ยอดขาย", "สุทธิ", "ออเดอร์", "ยกเลิก", "ยอดยกเลิก", "%ยกเลิก"];
  PLATFORMS.forEach((p, i) => {
    const c0 = 2 + i * sub.length;
    ws.mergeCells(1, c0, 1, c0 + sub.length - 1);
    header(ws.getCell(1, c0), PLATFORM_LABEL[p]);
    sub.forEach((h, j) => {
      header(ws.getCell(2, c0 + j), h);
      ws.getColumn(c0 + j).width = j < 2 || j === 4 ? 13 : 9;
    });
  });

  // net + cancelled amount aren't in platformDaily; aggregate directly
  const days = platformDaily(reports, from, to);
  for (const d of days) {
    const values: ExcelJS.CellValue[] = [toDate(d.date)];
    for (const p of PLATFORMS) {
      const lines = reports.filter((r) => r.date === d.date).flatMap((r) => r.deliveries.filter((x) => x.platform === p));
      const net = lines.reduce((a, x) => a + x.net, 0);
      const cAmt = lines.reduce((a, x) => a + x.cancelledAmount, 0);
      values.push(d[p].gross, net, d[p].orders, d[p].cancelledOrders, cAmt, cancelRate(d[p].orders, d[p].cancelledOrders));
    }
    const row = ws.addRow(values);
    row.eachCell((c, i) => {
      c.font = { name: FONT, size: 10 };
      c.border = border;
      if (i === 1) c.numFmt = "d/M/yyyy";
      else {
        const j = (i - 2) % sub.length;
        c.numFmt = j === 2 || j === 3 ? INT : j === 5 ? "0.0%" : THB;
      }
    });
  }
  const first = 3;
  const last = ws.rowCount;
  if (last >= first) {
    const total = ws.addRow(["รวม"]);
    PLATFORMS.forEach((_, i) => {
      for (let j = 0; j < sub.length; j++) {
        const col = 2 + i * sub.length + j;
        const L = ws.getColumn(col).letter;
        if (j === 5) {
          const o = ws.getColumn(col - 3).letter;
          const c = ws.getColumn(col - 2).letter;
          total.getCell(col).value = { formula: `IFERROR(${c}${last + 1}/(${o}${last + 1}+${c}${last + 1}),0)` };
          total.getCell(col).numFmt = "0.0%";
        } else {
          total.getCell(col).value = { formula: `SUM(${L}${first}:${L}${last})` };
          total.getCell(col).numFmt = j === 2 || j === 3 ? INT : THB;
        }
      }
    });
    total.eachCell((c) => {
      c.font = { name: FONT, size: 10, bold: true };
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CREAM } };
      c.border = border;
    });
  }
  return Buffer.from(await wb.xlsx.writeBuffer());
}
