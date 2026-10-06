import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma, ReportStatus } from "@prisma/client";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import { Button, Card, DiffValue, Empty, Input, LinkButton, PageHeader, Select, StatusBadge, cx } from "@/components/ui";
import { requireUser } from "@/lib/dal";
import { db } from "@/lib/db";
import { STATUS_LABEL } from "@/lib/constants";
import { addDays, fmtDate, isValidISO, todayISO, toDbDate } from "@/lib/dates";
import { count, money } from "@/lib/format";
import { branchScope, isAdmin } from "@/lib/permissions";
import { reportInclude, toView } from "@/lib/reports";

export const metadata: Metadata = { title: "ประวัติ" };

const PAGE = 20;
type SP = { branch?: string; from?: string; to?: string; status?: string; q?: string; page?: string };

export default async function HistoryPage({ searchParams }: { searchParams: Promise<SP> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const today = todayISO();
  const from = isValidISO(sp.from) ? sp.from : addDays(today, -30);
  const to = isValidISO(sp.to) ? sp.to : today;
  const status = sp.status && sp.status in STATUS_LABEL ? (sp.status as ReportStatus) : undefined;
  const q = sp.q?.trim();
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Prisma.DailyReportWhereInput = {
    ...branchScope(user, sp.branch),
    date: { gte: toDbDate(from), lte: toDbDate(to) },
    ...(status && { status }),
    ...(q && {
      OR: [
        { recorder: { name: { contains: q, mode: "insensitive" } } },
        { billStart: { contains: q } },
        { billEnd: { contains: q } },
        { note: { contains: q, mode: "insensitive" } },
      ],
    }),
  };

  const [total, rows, branches] = await Promise.all([
    db.dailyReport.count({ where }),
    db.dailyReport.findMany({
      where,
      include: reportInclude,
      orderBy: [{ date: "desc" }, { branch: { name: "asc" } }],
      skip: (page - 1) * PAGE,
      take: PAGE,
    }),
    isAdmin(user) ? db.branch.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }) : [],
  ]);
  const reports = rows.map(toView);
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const qs = (p: number) => {
    const u = new URLSearchParams(Object.entries({ ...sp, page: String(p) }).filter(([, v]) => v) as [string, string][]);
    return `/daily?${u}`;
  };

  return (
    <>
      <PageHeader
        title="ประวัติรายงาน"
        sub={`${count(total)} รายการ`}
        actions={
          <LinkButton href="/daily/new">
            <Plus className="size-4" /> บันทึกยอด
          </LinkButton>
        }
      />

      <Card className="mb-5 p-4">
        <form className="grid grid-cols-2 gap-3 md:grid-cols-[repeat(5,minmax(0,1fr))_auto]">
          {isAdmin(user) && (
            <Select name="branch" defaultValue={sp.branch ?? ""} aria-label="สาขา">
              <option value="">ทุกสาขา</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          )}
          <Input type="date" name="from" defaultValue={from} aria-label="ตั้งแต่" />
          <Input type="date" name="to" defaultValue={to} aria-label="ถึง" />
          <Select name="status" defaultValue={status ?? ""} aria-label="สถานะ">
            <option value="">ทุกสถานะ</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
          <Input name="q" defaultValue={q} placeholder="ผู้บันทึก / เลขบิล" className={cx(!isAdmin(user) && "md:col-span-2")} />
          <Button variant="dark" className="col-span-2 md:col-span-1">
            <Search className="size-4" /> ค้นหา
          </Button>
        </form>
      </Card>

      <Card className="overflow-hidden">
        {reports.length === 0 ? (
          <Empty>ไม่พบรายงาน</Empty>
        ) : (
          <>
            {/* desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead className="bg-card-2 text-xs text-muted">
                  <tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:font-medium">
                    <th className="text-left">วันที่</th>
                    <th className="text-left">สาขา</th>
                    <th className="text-left">ผู้บันทึก</th>
                    <th className="text-right">หน้าร้าน</th>
                    <th className="text-right">เดลิเวอรี่</th>
                    <th className="text-right">รวม</th>
                    <th className="text-right">ผลต่างเงินสด</th>
                    <th className="text-right">ยกเลิก</th>
                    <th className="text-left">สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r.id} className="group border-t border-line transition hover:bg-card-2 [&>td]:px-4 [&>td]:py-3">
                      <td>
                        <Link href={`/daily/${r.id}`} className="font-medium group-hover:text-brand">
                          {fmtDate(r.date)}
                        </Link>
                      </td>
                      <td>{r.branchName}</td>
                      <td className="text-ink-2">{r.recorderName}</td>
                      <td className="num text-right">{money(r.summary.inStorePos)}</td>
                      <td className="num text-right">{money(r.summary.deliveryGross)}</td>
                      <td className="num text-right font-semibold">{money(r.summary.totalSales)}</td>
                      <td className="text-right">
                        <DiffValue value={r.summary.cashDiff} />
                      </td>
                      <td className={cx("num text-right", r.summary.cancelledOrders > 0 && "text-bad")}>{count(r.summary.cancelledOrders)}</td>
                      <td>
                        <StatusBadge status={r.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* mobile list */}
            <ul className="divide-y divide-line md:hidden">
              {reports.map((r) => (
                <li key={r.id}>
                  <Link href={`/daily/${r.id}`} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1">
                      <div className="font-medium">{fmtDate(r.date)}</div>
                      <div className="text-xs text-muted">
                        {r.branchName} · {r.recorderName}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="num font-semibold">฿{money(r.summary.totalSales)}</div>
                      <StatusBadge status={r.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm">
          <LinkButton href={qs(page - 1)} variant="secondary" size="sm" aria-disabled={page <= 1} className={cx(page <= 1 && "pointer-events-none opacity-40")}>
            <ChevronLeft className="size-4" />
          </LinkButton>
          <span className="px-2 text-muted">
            {page} / {pages}
          </span>
          <LinkButton href={qs(page + 1)} variant="secondary" size="sm" aria-disabled={page >= pages} className={cx(page >= pages && "pointer-events-none opacity-40")}>
            <ChevronRight className="size-4" />
          </LinkButton>
        </div>
      )}
    </>
  );
}
