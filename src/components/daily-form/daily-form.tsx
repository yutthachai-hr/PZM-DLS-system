"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Loader2, RotateCcw, Save, Send } from "lucide-react";
import { saveReport, type ReportPayload } from "@/app/actions/reports";
import { lineDiff, summarize } from "@/lib/calc";
import { CHECKLIST, DIFF_ALERT, PAYMENT_LABEL, type PlatformKey } from "@/lib/constants";
import { money } from "@/lib/format";
import { Button, Card, DiffValue, Field, Input, Select, StatusBadge, cx, inputCls } from "@/components/ui";
import { DeliveryBanner } from "./delivery-banner";
import { MoneyInput, type FormDelivery, type FormPayment, type FormValues, type Num } from "./fields";

const n = (s: Num) => {
  const v = Number(s);
  return Number.isFinite(v) ? v : 0;
};

function toPayload(v: FormValues): ReportPayload {
  return {
    ...v,
    float: n(v.float),
    payments: v.payments.map((p) => ({ ...p, posAmount: n(p.posAmount), countedAmount: n(p.countedAmount) })),
    deliveries: v.deliveries.map((d) => ({
      ...d,
      gross: n(d.gross),
      net: n(d.net),
      orders: n(d.orders),
      cancelledOrders: n(d.cancelledOrders),
      cancelledAmount: n(d.cancelledAmount),
    })),
  };
}

export function DailyForm({
  initial,
  branches,
  canPickBranch,
  recorderName,
  status,
}: {
  initial: FormValues;
  branches: { id: string; name: string }[];
  canPickBranch: boolean;
  recorderName: string;
  status?: "DRAFT" | "SUBMITTED" | "APPROVED";
}) {
  const router = useRouter();
  const [v, setV] = useState<FormValues>(initial);
  const [error, setError] = useState<{ msg: string; existingId?: string; field?: string } | null>(null);
  const [pending, start] = useTransition();
  const [restorable, setRestorable] = useState<FormValues | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const isNew = !initial.id;
  const draftKey = isNew ? `pm-draft:${v.branchId}:${v.date}` : `pm-draft:edit:${initial.id}`;

  // ---- local autosave (survives a closed tab / dead battery) ----
  const touched = useRef(false);
  useEffect(() => {
    // read after hydration so server and client render the same markup
    const t = setTimeout(() => {
      try {
        const raw = localStorage.getItem(draftKey);
        setRestorable(raw ? JSON.parse(raw) : null);
      } catch {}
    }, 0);
    return () => clearTimeout(t);
  }, [draftKey]);
  useEffect(() => {
    if (!touched.current) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify(v));
      } catch {}
    }, 400);
    return () => clearTimeout(t);
  }, [v, draftKey]);

  const update = (patch: Partial<FormValues>) => {
    touched.current = true;
    setV((s) => ({ ...s, ...patch }));
  };
  const setPay = (i: number, patch: Partial<FormPayment>) =>
    update({ payments: v.payments.map((p, j) => (j === i ? { ...p, ...patch } : p)) });
  const setDel = (i: number, patch: Partial<FormDelivery>) =>
    update({ deliveries: v.deliveries.map((d, j) => (j === i ? { ...d, ...patch } : d)) });

  const sum = useMemo(() => summarize(toPayload(v) as Parameters<typeof summarize>[0]), [v]);

  function submit(final: boolean) {
    setError(null);
    start(async () => {
      const res = await saveReport(toPayload(v), final);
      if (!res.ok) {
        setError({ msg: res.error, existingId: res.existingId, field: res.field });
        if (res.field) {
          const el = formRef.current?.querySelector<HTMLElement>(`[data-field="${res.field}"]`);
          el?.scrollIntoView({ behavior: "smooth", block: "center" });
          el?.focus();
        }
        return;
      }
      try {
        localStorage.removeItem(draftKey);
      } catch {}
      router.push(`/daily/${res.id}?saved=${final ? "submit" : "draft"}`);
      router.refresh();
    });
  }

  // Enter jumps to the next field instead of submitting
  function onKeyDown(e: React.KeyboardEvent<HTMLFormElement>) {
    const t = e.target as HTMLElement;
    if (e.key !== "Enter" || t.tagName === "TEXTAREA" || t.tagName === "BUTTON") return;
    e.preventDefault();
    const fields = Array.from(formRef.current?.querySelectorAll<HTMLElement>("input:not([type=checkbox]):not([disabled]),select,textarea") ?? []);
    fields[fields.indexOf(t) + 1]?.focus();
  }

  const featured = v.deliveries.filter((d) => d.platform === "GRAB" || d.platform === "LINEMAN");
  const others = v.deliveries.filter((d) => d.platform !== "GRAB" && d.platform !== "LINEMAN");
  const idx = (p: PlatformKey) => v.deliveries.findIndex((d) => d.platform === p);

  return (
    <form ref={formRef} onKeyDown={onKeyDown} onSubmit={(e) => e.preventDefault()} className="space-y-6">
      {restorable && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-cheese bg-cheese-soft px-4 py-3 text-sm">
          <RotateCcw className="size-4 text-warn" />
          <span className="flex-1">มีข้อมูลที่ยังไม่ได้บันทึกค้างอยู่</span>
          <Button type="button" size="sm" variant="dark" onClick={() => (setV(restorable), setRestorable(null), (touched.current = true))}>
            กู้คืน
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              try {
                localStorage.removeItem(draftKey);
              } catch {}
              setRestorable(null);
            }}
          >
            ทิ้ง
          </Button>
        </div>
      )}

      {/* ---------- header ---------- */}
      <Card className="p-5">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
          <Field label="วันที่" className="col-span-1">
            <Input
              type="date"
              value={v.date}
              max={initial.date > v.date ? initial.date : undefined}
              disabled={!isNew}
              data-field="date"
              onChange={(e) => update({ date: e.target.value })}
              required
            />
          </Field>
          <Field label="สาขา">
            {canPickBranch && isNew ? (
              <Select value={v.branchId} data-field="branchId" onChange={(e) => update({ branchId: e.target.value })}>
                <option value="">เลือกสาขา</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            ) : (
              <Input value={branches.find((b) => b.id === v.branchId)?.name ?? "-"} disabled />
            )}
          </Field>
          <Field label="ผู้บันทึก">
            <Input value={recorderName} disabled />
          </Field>
          <Field label="บิลเริ่ม">
            <Input value={v.billStart} onChange={(e) => update({ billStart: e.target.value })} placeholder="เช่น 000101" />
          </Field>
          <Field label="บิลสิ้นสุด">
            <Input value={v.billEnd} onChange={(e) => update({ billEnd: e.target.value })} placeholder="เช่น 000188" />
          </Field>
        </div>
        {status && (
          <div className="mt-4 flex items-center gap-2 text-xs text-muted">
            สถานะ <StatusBadge status={status} />
          </div>
        )}
      </Card>

      {/* ---------- 1. in-store ---------- */}
      <section>
        <SectionTitle no={1} title="หน้าร้าน" sub="In-store" />
        <Card className="overflow-hidden">
          <div className="hidden grid-cols-[1.3fr_1fr_1fr_.9fr_1.4fr] gap-3 border-b border-line bg-card-2 px-5 py-2.5 text-xs font-medium text-muted md:grid">
            <span>ช่องทาง</span>
            <span className="text-right">ยอด POS</span>
            <span className="text-right">นับจริง</span>
            <span className="text-right">ผลต่าง</span>
            <span>หมายเหตุ</span>
          </div>
          {v.payments.map((p, i) => {
            const d = lineDiff({ posAmount: n(p.posAmount), countedAmount: n(p.countedAmount) });
            const needNote = Math.abs(d) > DIFF_ALERT && !p.note;
            return (
              <div key={p.method} className="grid grid-cols-2 items-center gap-3 border-b border-line px-5 py-4 last:border-0 md:grid-cols-[1.3fr_1fr_1fr_.9fr_1.4fr] md:py-3">
                <div className="col-span-2 flex items-center justify-between md:col-span-1">
                  <div>
                    <div className="font-medium">{PAYMENT_LABEL[p.method].th}</div>
                    <div className="text-xs text-muted">{PAYMENT_LABEL[p.method].en}</div>
                  </div>
                  <DiffValue value={d} className="text-sm md:hidden" />
                </div>
                <label>
                  <span className="mb-1 block text-xs text-muted md:hidden">ยอด POS</span>
                  <MoneyInput value={p.posAmount} onChange={(x) => setPay(i, { posAmount: x })} aria-label={`${PAYMENT_LABEL[p.method].th} ยอด POS`} />
                </label>
                <label>
                  <span className="mb-1 block text-xs text-muted md:hidden">นับจริง</span>
                  <MoneyInput value={p.countedAmount} onChange={(x) => setPay(i, { countedAmount: x })} aria-label={`${PAYMENT_LABEL[p.method].th} นับจริง`} />
                </label>
                <div className="hidden text-right md:block">
                  <DiffValue value={d} />
                </div>
                <Input
                  className={cx("col-span-2 md:col-span-1", needNote && "border-warn ring-4 ring-warn/15")}
                  value={p.note}
                  data-field={`pay.${p.method}.note`}
                  onChange={(e) => setPay(i, { note: e.target.value })}
                  placeholder={needNote ? "ผลต่างสูง ระบุเหตุผล" : "หมายเหตุ"}
                />
              </div>
            );
          })}
          <div className="grid grid-cols-2 gap-3 bg-card-2 px-5 py-3 text-sm md:grid-cols-[1.3fr_1fr_1fr_.9fr_1.4fr]">
            <span className="font-medium">รวมหน้าร้าน</span>
            <span className="num text-right font-semibold">{money(sum.inStorePos)}</span>
            <span className="num hidden text-right md:block">{money(sum.inStoreCounted)}</span>
            <span className="hidden text-right md:block">
              <DiffValue value={sum.totalDiff} />
            </span>
          </div>
        </Card>
      </section>

      {/* ---------- 2. delivery ---------- */}
      <section>
        <SectionTitle no={2} title="เดลิเวอรี่" sub="Delivery" />
        <div className="grid gap-4 lg:grid-cols-2">
          {featured.map((d) => (
            <DeliveryBanner key={d.platform} value={d} onChange={(patch) => setDel(idx(d.platform), patch)} size="lg" />
          ))}
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {others.map((d) => (
            <DeliveryBanner key={d.platform} value={d} onChange={(patch) => setDel(idx(d.platform), patch)} size="sm" />
          ))}
        </div>
      </section>

      {/* ---------- 3. summary ---------- */}
      <section>
        <SectionTitle no={3} title="สรุปสิ้นวัน" sub="Summary & checklist" />
        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <Card className="p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="เงินทอนสำรอง (Float)">
                <MoneyInput value={v.float} onChange={(x) => update({ float: x })} />
              </Field>
              <div className="rounded-xl bg-good-soft p-3">
                <div className="text-xs text-ink-2">เงินสดนำฝาก</div>
                <div className="num font-display text-2xl font-semibold text-good">{money(sum.cashToDeposit)}</div>
                <div className="text-[11px] text-muted">นับจริง (เงินสด) − Float</div>
              </div>
            </div>
            <Field label="หมายเหตุ" className="mt-4">
              <textarea
                value={v.note}
                onChange={(e) => update({ note: e.target.value })}
                rows={2}
                className={cx(inputCls, "h-auto py-2")}
                placeholder="เหตุการณ์ผิดปกติ, ของเสีย ฯลฯ"
              />
            </Field>
          </Card>
          <Card className="p-5">
            <div className="mb-3 text-xs font-medium text-ink-2">เอกสารครบ</div>
            <div className="grid grid-cols-2 gap-2">
              {CHECKLIST.map((c) => (
                <label
                  key={c.key}
                  className={cx(
                    "flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-3 text-sm transition select-none",
                    v[c.key] ? "border-good bg-good-soft text-good" : "border-line hover:bg-card-2",
                  )}
                >
                  <input type="checkbox" className="sr-only" checked={v[c.key]} onChange={(e) => update({ [c.key]: e.target.checked } as Partial<FormValues>)} />
                  <CheckCircle2 className={cx("size-5", v[c.key] ? "opacity-100" : "opacity-25")} />
                  {c.label}
                </label>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* ---------- sticky action bar ---------- */}
      <div className="sticky bottom-20 z-20 lg:bottom-4">
        {error && (
          <div role="alert" className="mb-2 flex flex-wrap items-center gap-3 rounded-2xl bg-bad px-4 py-2.5 text-sm text-white shadow-lg">
            <AlertTriangle className="size-4" />
            <span className="flex-1">{error.msg}</span>
            {error.existingId && (
              <Link href={`/daily/${error.existingId}`} className="font-medium underline">
                เปิดรายงานเดิม
              </Link>
            )}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl bg-sidebar px-5 py-3 text-sidebar-ink shadow-2xl shadow-black/30">
          <div>
            <div className="text-[11px] opacity-60">ยอดขายรวม</div>
            <div className="num font-display text-2xl leading-tight font-semibold">฿{money(sum.totalSales)}</div>
          </div>
          <div className="hidden text-xs leading-5 opacity-80 sm:block">
            <div>
              หน้าร้าน <span className="num">{money(sum.inStorePos)}</span>
            </div>
            <div>
              เดลิเวอรี่ <span className="num">{money(sum.deliveryGross)}</span>
            </div>
          </div>
          <div className="ml-auto flex gap-2">
            {(isNew || status === "DRAFT") && (
              <Button type="button" variant="ghost" className="text-sidebar-ink hover:bg-white/10" disabled={pending} onClick={() => submit(false)}>
                <Save className="size-4" /> บันทึกร่าง
              </Button>
            )}
            <Button type="button" disabled={pending} onClick={() => submit(true)}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              {isNew || status === "DRAFT" ? "ส่งรายงาน" : "บันทึก"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}

function SectionTitle({ no, title, sub }: { no: number; title: string; sub: string }) {
  return (
    <div className="mb-3 flex items-baseline gap-2">
      <span className="grid size-6 place-items-center rounded-full bg-brand font-display text-xs font-semibold text-white">{no}</span>
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      <span className="text-xs text-muted">{sub}</span>
    </div>
  );
}

export type { FormValues };
