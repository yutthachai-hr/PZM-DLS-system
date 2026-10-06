import Link from "next/link";
import { AlertCircle, Banknote, Bike, CheckCircle2, Plus, Scale, ShoppingBag, Store, XCircle } from "lucide-react";
import { Legend, PlatformBarChart, SalesTrendChart } from "@/components/dashboard/charts";
import { RangeFilter } from "@/components/dashboard/filters";
import { StatTile } from "@/components/dashboard/stat-tile";
import { Card, CardHeader, DiffValue, Empty, LinkButton, PageHeader, StatusBadge, cx } from "@/components/ui";
import { byBranch, dailySeries, delta, platformTotals, totals } from "@/lib/analytics";
import { PLATFORM_LABEL } from "@/lib/constants";
import { requireUser } from "@/lib/dal";
import { db } from "@/lib/db";
import { fmtDate, fmtDateLong, previousRange, resolveRange, todayISO, toDbDate } from "@/lib/dates";
import { count, money, money0, pct, signed } from "@/lib/format";
import { branchScope, isAdmin } from "@/lib/permissions";
import { listReportsInRange } from "@/lib/reports";

type SP = { range?: string; from?: string; to?: string; branch?: string };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<SP> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const today = todayISO();
  const range = resolveRange(sp.range ?? "7d", sp.from, sp.to, today);
  const prev = previousRange(range.from, range.to);
  const admin = isAdmin(user);
  const scope = branchScope(user, sp.branch);

  const [reports, prevReports, branches, todays] = await Promise.all([
    listReportsInRange(scope, range.from, range.to),
    listReportsInRange(scope, prev.from, prev.to),
    db.branch.findMany({
      where: { active: true, ...(admin ? (sp.branch ? { id: sp.branch } : {}) : { id: user.branchId ?? "__none__" }) },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.dailyReport.findMany({ where: { ...scope, date: toDbDate(today) }, select: { id: true, branchId: true, status: true } }),
  ]);
  const allBranches = admin ? await db.branch.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }) : undefined;

  const t = totals(reports);
  const p = totals(prevReports);
  const series = dailySeries(reports, range.from, range.to);
  const plats = platformTotals(reports);
  const branchRows = byBranch(reports);
  const todayById = new Map(todays.map((r) => [r.branchId, r]));
  const mixInStore = t.totalSales ? t.inStore / t.totalSales : 0;
  const featured = plats.filter((x) => x.platform === "GRAB" || x.platform === "LINEMAN");

  const periodLabel = range.from === range.to ? fmtDateLong(range.from) : `${fmtDate(range.from)} – ${fmtDate(range.to)}`;

  return (
    <>
      <PageHeader
        title={`สวัสดี ${user.name.split(" ")[0]} 👋`}
        sub={`${user.branch?.name ?? (sp.branch ? branches[0]?.name : "ทุกสาขา")} · ${periodLabel}`}
        actions={
          <LinkButton href="/daily/new" size="lg">
            <Plus className="size-5" /> บันทึกยอดวันนี้
          </LinkButton>
        }
      />
      <RangeFilter range={range.key} from={range.from} to={range.to} branches={allBranches} branch={sp.branch} />

      {/* today's status per branch */}
      <Card className="mb-6 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-2 text-sm font-medium">ส่งยอดวันนี้</span>
          {branches.map((b) => {
            const r = todayById.get(b.id);
            const done = r && r.status !== "DRAFT";
            return (
              <Link
                key={b.id}
                href={r ? `/daily/${r.id}` : `/daily/new?branch=${b.id}`}
                className={cx(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition hover:shadow",
                  done ? "border-good/30 bg-good-soft text-good" : r ? "border-cheese bg-cheese-soft text-warn" : "border-bad/30 bg-bad-soft text-bad",
                )}
              >
                {done ? <CheckCircle2 className="size-4" /> : r ? <AlertCircle className="size-4" /> : <XCircle className="size-4" />}
                {b.name}
                <span className="text-xs opacity-80">{done ? "ส่งแล้ว" : r ? "ร่าง" : "ยังไม่ส่ง"}</span>
              </Link>
            );
          })}
          {branches.length === 0 && <span className="text-sm text-muted">ไม่มีสาขา</span>}
        </div>
      </Card>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="col-span-2">
          <StatTile
            hero
            label="ยอดขายรวม"
            value={`฿${money0(t.totalSales)}`}
            delta={delta(t.totalSales, p.totalSales)}
            sub={<>เทียบช่วงก่อน · {count(t.reports)} รายงาน</>}
          />
        </div>
        <StatTile label="หน้าร้าน" value={money0(t.inStore)} delta={delta(t.inStore, p.inStore)} icon={<Store className="size-4" />} sub={t.totalSales ? pct(mixInStore, 0) : undefined} />
        <StatTile label="เดลิเวอรี่" value={money0(t.delivery)} delta={delta(t.delivery, p.delivery)} icon={<Bike className="size-4" />} sub={t.totalSales ? pct(1 - mixInStore, 0) : undefined} />
        <StatTile
          label="เงินสด ขาด/เกิน"
          value={signed(t.cashDiff)}
          tone={t.cashDiff < 0 ? "bad" : t.cashDiff > 0 ? "good" : undefined}
          icon={<Scale className="size-4" />}
          sub="นับจริง − POS"
        />
        <StatTile label="นำฝาก" value={money0(t.cashToDeposit)} icon={<Banknote className="size-4" />} sub="เงินสด − Float" />
        <StatTile label="ออเดอร์เดลิเวอรี่" value={count(t.orders)} delta={delta(t.orders, p.orders)} icon={<ShoppingBag className="size-4" />} />
        <StatTile
          label="ออเดอร์ยกเลิก"
          value={count(t.cancelledOrders)}
          delta={delta(t.cancelledOrders, p.cancelledOrders)}
          upIsGood={false}
          tone={t.cancelledOrders > 0 ? "bad" : undefined}
          icon={<XCircle className="size-4" />}
          sub={`${pct(t.cancelRate)} · ฿${money0(t.cancelledAmount)}`}
        />
      </div>

      {/* charts */}
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader
            title="ยอดขายรายวัน"
            sub="หน้าร้าน + เดลิเวอรี่"
            action={
              <Legend
                items={[
                  { label: "หน้าร้าน", color: "var(--s-instore)" },
                  { label: "เดลิเวอรี่", color: "var(--s-delivery)" },
                ]}
              />
            }
          />
          <div className="px-3 pt-4 pb-2">
            {t.reports === 0 ? <Empty>ยังไม่มีข้อมูลในช่วงนี้</Empty> : <SalesTrendChart data={series} />}
          </div>
          {t.reports > 0 && (
            <details className="border-t border-line px-5 py-3 text-sm">
              <summary className="cursor-pointer text-xs text-muted">ดูเป็นตาราง</summary>
              <div className="mt-2 max-h-64 overflow-auto">
                <table className="w-full text-xs">
                  <thead className="text-muted">
                    <tr className="[&>th]:py-1">
                      <th className="text-left">วันที่</th>
                      <th className="text-right">หน้าร้าน</th>
                      <th className="text-right">เดลิเวอรี่</th>
                      <th className="text-right">รวม</th>
                    </tr>
                  </thead>
                  <tbody className="num">
                    {series.map((d) => (
                      <tr key={d.date} className="border-t border-line [&>td]:py-1">
                        <td>{fmtDate(d.date)}</td>
                        <td className="text-right">{money(d.inStore)}</td>
                        <td className="text-right">{money(d.delivery)}</td>
                        <td className="text-right font-medium">{money(d.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          )}
        </Card>

        <Card>
          <CardHeader title="ยอดตามแพลตฟอร์ม" sub="Gross" action={<Link href="/delivery" className="text-xs text-brand hover:underline">ดูทั้งหมด</Link>} />
          <div className="px-3 pt-2">
            <PlatformBarChart data={plats.map((x) => ({ label: PLATFORM_LABEL[x.platform], gross: x.gross }))} />
          </div>
          <div className="grid grid-cols-2 gap-3 p-5 pt-2">
            {featured.map((x) => (
              <div key={x.platform} className="rounded-xl bg-card-2 p-3">
                <div className="text-xs font-medium">{PLATFORM_LABEL[x.platform]}</div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="num text-lg font-semibold">{count(x.orders)}</span>
                  <span className="text-[11px] text-muted">ออเดอร์</span>
                </div>
                <div className={cx("text-xs", x.cancelledOrders ? "text-bad" : "text-muted")}>
                  ยกเลิก {count(x.cancelledOrders)} ({pct(x.cancelRate)})
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* branches + recent */}
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        {admin && !sp.branch && (
          <Card className="overflow-hidden">
            <CardHeader title="เทียบสาขา" />
            {branchRows.length === 0 ? (
              <Empty>ยังไม่มีข้อมูล</Empty>
            ) : (
              <div className="overflow-x-auto">
                <table className="mt-3 w-full text-sm">
                  <thead className="bg-card-2 text-xs text-muted">
                    <tr className="[&>th]:px-4 [&>th]:py-2 [&>th]:font-medium">
                      <th className="text-left">สาขา</th>
                      <th className="text-right">ยอดรวม</th>
                      <th className="text-right">เดลิเวอรี่</th>
                      <th className="text-right">ขาด/เกิน</th>
                      <th className="text-right">ยกเลิก</th>
                    </tr>
                  </thead>
                  <tbody>
                    {branchRows.map((b) => (
                      <tr key={b.branchId} className="border-t border-line [&>td]:px-4 [&>td]:py-2.5">
                        <td className="font-medium">{b.branchName}</td>
                        <td className="num text-right font-semibold">{money0(b.totals.totalSales)}</td>
                        <td className="num text-right">{pct(b.totals.totalSales ? b.totals.delivery / b.totals.totalSales : 0, 0)}</td>
                        <td className="text-right">
                          <DiffValue value={b.totals.cashDiff} />
                        </td>
                        <td className="num text-right">{count(b.totals.cancelledOrders)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}
        <Card className={cx("overflow-hidden", !(admin && !sp.branch) && "xl:col-span-2")}>
          <CardHeader title="รายงานล่าสุด" action={<Link href="/daily" className="text-xs text-brand hover:underline">ทั้งหมด</Link>} />
          {reports.length === 0 ? (
            <Empty>ยังไม่มีรายงาน</Empty>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {[...reports]
                .reverse()
                .slice(0, 6)
                .map((r) => (
                  <li key={r.id}>
                    <Link href={`/daily/${r.id}`} className="flex items-center gap-3 px-5 py-3 transition hover:bg-card-2">
                      <div className="flex-1">
                        <div className="text-sm font-medium">{fmtDate(r.date)}</div>
                        <div className="text-xs text-muted">
                          {r.branchName} · {r.recorderName}
                        </div>
                      </div>
                      <span className="num text-sm font-semibold">฿{money(r.summary.totalSales)}</span>
                      <StatusBadge status={r.status} />
                    </Link>
                  </li>
                ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
