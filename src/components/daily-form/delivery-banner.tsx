"use client";

import { Ban, Bike, Receipt } from "lucide-react";
import { cancelRate, feeRate } from "@/lib/calc";
import { PLATFORM_LABEL, PLATFORM_STYLE } from "@/lib/constants";
import { pct } from "@/lib/format";
import { cx, inputCls } from "@/components/ui";
import { MoneyInput, type FormDelivery } from "./fields";

const n = (s: string) => Number(s) || 0;

function IntInput({ value, onChange, ...rest }: { value: string; onChange: (v: string) => void } & Omit<React.ComponentProps<"input">, "value" | "onChange">) {
  return (
    <input
      type="number"
      inputMode="numeric"
      min={0}
      step={1}
      placeholder="0"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onWheel={(e) => e.currentTarget.blur()}
      onFocus={(e) => e.currentTarget.select()}
      className={cx(inputCls, "num text-right")}
      {...rest}
    />
  );
}

export function DeliveryBanner({ value: d, onChange, size }: { value: FormDelivery; onChange: (p: Partial<FormDelivery>) => void; size: "lg" | "sm" }) {
  const style = PLATFORM_STYLE[d.platform];
  const fee = feeRate(n(d.gross), n(d.net));
  const cr = cancelRate(n(d.orders), n(d.cancelledOrders));
  const label = PLATFORM_LABEL[d.platform];
  const hasCancel = n(d.cancelledOrders) > 0;

  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-card shadow-[0_8px_24px_-12px_rgb(28_25_23/0.18)]">
      {/* banner */}
      <div className="relative flex items-center gap-3 px-5 py-4 text-white" style={{ background: style.bg }}>
        {d.platform === "LINEMAN" && <span aria-hidden className="absolute inset-y-0 left-0 w-1.5 bg-[#06c755]" />}
        <span className="grid size-10 place-items-center rounded-xl bg-white/15 backdrop-blur">
          <Bike className="size-5" />
        </span>
        <div className="flex-1">
          <div className={cx("font-display font-semibold", size === "lg" ? "text-xl" : "text-base")}>{label}</div>
          <div className="text-[11px] opacity-75">ยอดต่อวัน · กรอกจากแอปร้านค้า</div>
        </div>
        <div className="flex flex-col items-end gap-1 text-[11px]">
          <span className="rounded-full bg-white/15 px-2 py-0.5">ค่า GP {n(d.gross) ? pct(fee) : "—"}</span>
          <span className={cx("rounded-full px-2 py-0.5", hasCancel ? "bg-white text-bad" : "bg-white/15")}>ยกเลิก {n(d.orders) + n(d.cancelledOrders) ? pct(cr) : "—"}</span>
        </div>
      </div>

      {/* fields */}
      <div className={cx("grid gap-3 p-5", size === "lg" ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3")}>
        <label className={size === "lg" ? "col-span-2 sm:col-span-1" : ""}>
          <span className="mb-1 flex items-center gap-1 text-xs font-medium text-ink-2">
            <Receipt className="size-3.5" /> ยอดขาย (Gross)
          </span>
          <MoneyInput value={d.gross} onChange={(x) => onChange({ gross: x })} className={size === "lg" ? "h-12 text-lg font-semibold" : ""} aria-label={`${label} ยอดขาย`} />
        </label>
        <label className={size === "lg" ? "col-span-2 sm:col-span-1" : ""}>
          <span className="mb-1 block text-xs font-medium text-ink-2">ยอดสุทธิ (Net)</span>
          <MoneyInput
            value={d.net}
            onChange={(x) => onChange({ net: x })}
            className={cx(size === "lg" && "h-12 text-lg", n(d.net) > n(d.gross) && "border-bad")}
            data-field={`del.${d.platform}.net`}
            aria-label={`${label} ยอดสุทธิ`}
          />
        </label>
        <label>
          <span className="mb-1 block text-xs font-medium text-ink-2">ออเดอร์</span>
          <IntInput value={d.orders} onChange={(x) => onChange({ orders: x })} aria-label={`${label} ออเดอร์`} />
        </label>
        <label>
          <span className="mb-1 flex items-center gap-1 text-xs font-medium text-ink-2">
            <Ban className="size-3.5" /> ยกเลิก (ออเดอร์)
          </span>
          <IntInput value={d.cancelledOrders} onChange={(x) => onChange({ cancelledOrders: x })} aria-label={`${label} ออเดอร์ยกเลิก`} />
        </label>
        <label className={cx(size === "lg" ? "" : "col-span-1")}>
          <span className="mb-1 block text-xs font-medium text-ink-2">ยอดที่ยกเลิก</span>
          <MoneyInput value={d.cancelledAmount} onChange={(x) => onChange({ cancelledAmount: x })} aria-label={`${label} ยอดยกเลิก`} />
        </label>
        <label className={size === "lg" ? "" : "col-span-1 sm:col-span-1"}>
          <span className="mb-1 block text-xs font-medium text-ink-2">หมายเหตุ</span>
          <input
            value={d.note}
            onChange={(e) => onChange({ note: e.target.value })}
            placeholder={hasCancel ? "สาเหตุที่ยกเลิก" : ""}
            className={inputCls}
          />
        </label>
      </div>
    </div>
  );
}
