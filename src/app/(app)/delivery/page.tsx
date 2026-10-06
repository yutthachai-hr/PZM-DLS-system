import type { Metadata } from "next";
import { FileSpreadsheet } from "lucide-react";
import { Legend, PlatformTrendChart } from "@/components/dashboard/charts";
import { RangeFilter } from "@/components/dashboard/filters";
import { AnchorButton, Card, CardHeader, Empty, PageHeader, cx } from "@/components/ui";
import { platformDaily, platformTotals } from "@/lib/analytics";
import { PLATFORMS, PLATFORM_LABEL, PLATFORM_SERIES, PLATFORM_STYLE } from "@/lib/constants";
import { requireUser } from "@/lib/dal";
import { db } from "@/lib/db";
import { fmtDate, resolveRange } from "@/lib/dates";
import { count, money, money0, pct } from "@/lib/format";
import { branchScope, isAdmin } from "@/lib/permissions";
import { listReportsInRange } from "@/lib/reports";

export const metadata: Metadata = { title: "เดลิเวอรี่" };

type SP = { range?: string; from?: string; to?: string; branch?: string };

export default async function DeliveryPage({ searchParams }: { searchParams: Promise<SP> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const range = resolveRange(sp.range ?? "30d", sp.from, sp.to);
  const reports = await listReportsInRange(branchScope(user, sp.branch), range.from, range.to);
  const branches = isAdmin(user) ? await db.branch.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }) : undefined;

  const plats = platformTotals(reports);
  const days = platformDaily(reports, range.from, range.to);
  const chartData = days.map((d) => ({ date: d.date, ...Object.fromEntries(PLATFORMS.map((p) => [p, d[p].gross])) }));
  const exportQs = new URLSearchParams({ from: range.from, to: range.to, ...(sp.branch ? { branch: sp.branch } : {}) });

  return (
    <>
      <PageHeader
        title="รายงานเดลิเวอรี่"
        sub="Grab · LINE MAN · Shopee · อื่นๆ"
        actions={
          <AnchorButton href={`/api/export/delivery?${exportQs}`} size="sm">
            <FileSpreadsheet className="size-4" /> Excel
          </AnchorButton>
        }
      />
      <RangeFilter range={range.key} from={range.from} to={range.to} branches={branches} branch={sp.branch} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {plats.map((x) => (
          <div key={x.platform} className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-card">
            <div className="px-5 py-3 text-white" style={{ background: PLATFORM_STYLE[x.platform].bg }}>
              <div className="font-display font-semibold">{PLATFORM_LABEL[x.platform]}</div>
              <div className="num font-display text-2xl font-semibold">฿{money0(x.gross)}</div>
            </div>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-2 p-4 text-sm">
              <dt className="text-muted">ออเดอร์</dt>
              <dd className="num text-right font-medium">{count(x.orders)}</dd>
              <dt className="text-muted">ยกเลิก</dt>
              <dd className={cx("num text-right font-medium", x.cancelledOrders > 0 && "text-bad")}>
                {count(x.cancelledOrders)} <span className="text-xs">({pct(x.cancelRate)})</span>
              </dd>
              <dt className="text-muted">ยอดยกเลิก</dt>
              <dd className="num text-right">{money0(x.cancelledAmount)}</dd>
              <dt className="text-muted">สุทธิ</dt>
              <dd className="num text-right">{money0(x.net)}</dd>
              <dt className="text-muted">ค่า GP</dt>
              <dd className="num text-right">{pct(x.feeRate)}</dd>
              <dt className="text-muted">เฉลี่ย/บิล</dt>
              <dd className="num text-right">{money0(x.avgTicket)}</dd>
            </dl>
          </div>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader title="ยอดเดลิเวอรี่รายวัน" sub="Gross" action={<Legend items={PLATFORM_SERIES.map((s) => ({ label: s.label, color: s.color }))} />} />
        <div className="px-3 pt-4 pb-2">{reports.length ? <PlatformTrendChart data={chartData} /> : <Empty>ยังไม่มีข้อมูล</Empty>}</div>
      </Card>

      <Card className="mt-6 overflow-hidden">
        <CardHeader title="รายวัน: Grab / LINE MAN" />
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-card-2 text-xs text-muted">
              <tr className="[&>th]:px-3 [&>th]:py-2 [&>th]:font-medium">
                <th rowSpan={2} className="text-left">
                  วันที่
                </th>
                <th colSpan={3} className="border-l border-line text-center">
                  GrabFood
                </th>
                <th colSpan={3} className="border-l border-line text-center">
                  LINE MAN
                </th>
                <th colSpan={2} className="border-l border-line text-center">
                  อื่นๆ
                </th>
              </tr>
              <tr className="[&>th]:px-3 [&>th]:py-2 [&>th]:font-medium">
                {["GRAB", "LINEMAN"].map((p) => (
                  <Cols key={p} />
                ))}
                <th className="border-l border-line text-right">ยอด</th>
                <th className="text-right">ยกเลิก</th>
              </tr>
            </thead>
            <tbody className="num">
              {[...days].reverse().map((d) => {
                const otherGross = d.SHOPEE.gross + d.FOODPANDA_OTHER.gross;
                const otherCancel = d.SHOPEE.cancelledOrders + d.FOODPANDA_OTHER.cancelledOrders;
                return (
                  <tr key={d.date} className="border-t border-line [&>td]:px-3 [&>td]:py-2">
                    <td className="font-sans">{fmtDate(d.date)}</td>
                    {(["GRAB", "LINEMAN"] as const).map((p) => (
                      <PlatformCells key={p} v={d[p]} />
                    ))}
                    <td className="border-l border-line text-right">{money(otherGross)}</td>
                    <td className={cx("text-right", otherCancel > 0 && "text-bad")}>{count(otherCancel)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

function Cols() {
  return (
    <>
      <th className="border-l border-line text-right">ยอด</th>
      <th className="text-right">ออเดอร์</th>
      <th className="text-right">ยกเลิก</th>
    </>
  );
}

function PlatformCells({ v }: { v: { gross: number; orders: number; cancelledOrders: number } }) {
  return (
    <>
      <td className="border-l border-line text-right">{money(v.gross)}</td>
      <td className="text-right">{count(v.orders)}</td>
      <td className={cx("text-right", v.cancelledOrders > 0 && "font-medium text-bad")}>{count(v.cancelledOrders)}</td>
    </>
  );
}
