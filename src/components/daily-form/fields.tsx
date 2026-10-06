"use client";

import type { ChecklistKey, PaymentMethodKey, PlatformKey } from "@/lib/constants";
import { cx, inputCls } from "@/components/ui";

export type Num = string; // inputs keep raw text; converted when calculating/saving

export type FormPayment = { method: PaymentMethodKey; posAmount: Num; countedAmount: Num; note: string };
export type FormDelivery = {
  platform: PlatformKey;
  gross: Num;
  net: Num;
  orders: Num;
  cancelledOrders: Num;
  cancelledAmount: Num;
  note: string;
};
export type FormValues = {
  id?: string;
  branchId: string;
  date: string;
  billStart: string;
  billEnd: string;
  float: Num;
  note: string;
  payments: FormPayment[];
  deliveries: FormDelivery[];
} & Record<ChecklistKey, boolean>;

export function MoneyInput({ value, onChange, className, ...rest }: { value: Num; onChange: (v: Num) => void } & Omit<React.ComponentProps<"input">, "value" | "onChange">) {
  return (
    <input
      type="number"
      inputMode="decimal"
      min={0}
      step="0.01"
      placeholder="0.00"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onWheel={(e) => e.currentTarget.blur()}
      onFocus={(e) => e.currentTarget.select()}
      className={cx(inputCls, "num text-right", className)}
      {...rest}
    />
  );
}

