import { Check, X } from "lucide-react";
import { CHECKLIST, PAYMENT_LABEL, PLATFORM_LABEL } from "@/lib/constants";
import { cancelRate, lineDiff } from "@/lib/calc";
import { fmtDateLong } from "@/lib/dates";
import { count, money, pct } from "@/lib/format";
import type { ReportView } from "@/lib/reports";
import { DiffValue, StatusBadge, cx } from "./ui";

const th = "px-3 py-2 text-left text-xs font-medium text-muted";
const td = "px-3 py-2.5 border-t border-line";

/** Read-only daily report in the same 3-section layout as the Excel sheet. Used on screen and for print/PDF. */
export function ReportSheet({ r, print = false }: { r: ReportView; print?: boolean }) {
  const s = r.summary;
  const box = cx("overflow-hidden rounded-2xl border border-line bg-card", print && "rounded-lg");
  return (
    <div className="space-y-5">
      <div className={cx(box, "grid grid-cols-2 gap-x-6 gap-y-3 p-4 text-sm sm:grid-cols-4")}>
        <Info k="วันที่" v={fmtDateLong(r.date)} />
        <Info k="สาขา" v={r.branchName} />
        <Info k="ผู้บันทึก" v={r.recorderName} />
        <Info k="เลขที่บิล" v={r.billStart || r.billEnd ? `${r.billStart || "-"} – ${r.billEnd || "-"}` : "-"} />
        <Info k="สถานะ" v={<StatusBadge status={r.status} />} />
        {r.approvedByName && <Info k="อนุมัติโดย" v={r.approvedByName} />}
      </div>

      <section>
        <h3 className="mb-2 font-display font-semibold">1. หน้าร้าน</h3>
        <div className={cx(box, "overflow-x-auto")}>
          <table className="w-full min-w-[520px] text-sm">
            <thead className="bg-card-2">
              <tr>
                <th className={th}>ช่องทาง</th>
                <th className={cx(th, "text-right")}>ยอด POS</th>
                <th className={cx(th, "text-right")}>นับจริง</th>
                <th className={cx(th, "text-right")}>ผลต่าง</th>
                <th className={th}>หมายเหตุ</th>
              </tr>
            </thead>
            <tbody>
              {r.payments.map((p) => (
                <tr key={p.method}>
                  <td className={td}>{PAYMENT_LABEL[p.method].th}</td>
                  <td className={cx(td, "num text-right")}>{money(p.posAmount)}</td>
                  <td className={cx(td, "num text-right")}>{money(p.countedAmount)}</td>
                  <td className={cx(td, "text-right")}>
                    <DiffValue value={lineDiff(p)} />
                  </td>
                  <td className={cx(td, "text-ink-2")}>{p.note}</td>
                </tr>
              ))}
              <tr className="bg-card-2 font-semibold">
                <td className={td}>รวม</td>
                <td className={cx(td, "num text-right")}>{money(s.inStorePos)}</td>
                <td className={cx(td, "num text-right")}>{money(s.inStoreCounted)}</td>
                <td className={cx(td, "text-right")}>
                  <DiffValue value={s.totalDiff} />
                </td>
                <td className={td} />
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h3 className="mb-2 font-display font-semibold">2. เดลิเวอรี่</h3>
        <div className={cx(box, "overflow-x-auto")}>
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-card-2">
              <tr>
                <th className={th}>แพลตฟอร์ม</th>
                <th className={cx(th, "text-right")}>Gross</th>
                <th className={cx(th, "text-right")}>Net</th>
                <th className={cx(th, "text-right")}>ออเดอร์</th>
                <th className={cx(th, "text-right")}>ยกเลิก</th>
                <th className={cx(th, "text-right")}>ยอดยกเลิก</th>
                <th className={th}>หมายเหตุ</th>
              </tr>
            </thead>
            <tbody>
              {r.deliveries.map((d) => (
                <tr key={d.platform}>
                  <td className={td}>{PLATFORM_LABEL[d.platform]}</td>
                  <td className={cx(td, "num text-right")}>{money(d.gross)}</td>
                  <td className={cx(td, "num text-right")}>{money(d.net)}</td>
                  <td className={cx(td, "num text-right")}>{count(d.orders)}</td>
                  <td className={cx(td, "num text-right", d.cancelledOrders > 0 && "font-medium text-bad")}>
                    {count(d.cancelledOrders)}
                    {d.cancelledOrders > 0 && <span className="ml-1 text-xs">({pct(cancelRate(d.orders, d.cancelledOrders))})</span>}
                  </td>
                  <td className={cx(td, "num text-right")}>{money(d.cancelledAmount)}</td>
                  <td className={cx(td, "text-ink-2")}>{d.note}</td>
                </tr>
              ))}
              <tr className="bg-card-2 font-semibold">
                <td className={td}>รวม</td>
                <td className={cx(td, "num text-right")}>{money(s.deliveryGross)}</td>
                <td className={cx(td, "num text-right")}>{money(s.deliveryNet)}</td>
                <td className={cx(td, "num text-right")}>{count(s.orders)}</td>
                <td className={cx(td, "num text-right")}>{count(s.cancelledOrders)}</td>
                <td className={cx(td, "num text-right")}>{money(s.cancelledAmount)}</td>
                <td className={td} />
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h3 className="mb-2 font-display font-semibold">3. สรุปสิ้นวัน</h3>
        <div className="grid gap-4 sm:grid-cols-[1.4fr_1fr]">
          <div className={cx(box, "divide-y divide-line text-sm")}>
            <Row k="ยอดขายรวมทั้งหมด" v={money(s.totalSales)} strong />
            <Row k="เงินทอนสำรอง (Float)" v={money(r.float)} />
            <Row k="เงินสดนำฝาก" v={money(s.cashToDeposit)} strong />
            <Row k="ผลต่างเงินสด" v={<DiffValue value={s.cashDiff} />} />
          </div>
          <div className={cx(box, "p-4 text-sm")}>
            <div className="mb-2 text-xs font-medium text-muted">Checklist เอกสาร</div>
            <ul className="space-y-1.5">
              {CHECKLIST.map((c) => (
                <li key={c.key} className="flex items-center gap-2">
                  {r[c.key] ? <Check className="size-4 text-good" /> : <X className="size-4 text-bad" />}
                  <span className={r[c.key] ? "" : "text-muted"}>{c.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        {r.note && <p className={cx(box, "mt-4 p-4 text-sm whitespace-pre-wrap")}>📝 {r.note}</p>}
      </section>
    </div>
  );
}

function Info({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted">{k}</div>
      <div className="mt-0.5 font-medium">{v}</div>
    </div>
  );
}

function Row({ k, v, strong }: { k: string; v: React.ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-ink-2">{k}</span>
      <span className={cx("num", strong && "font-display text-lg font-semibold")}>{v}</span>
    </div>
  );
}
