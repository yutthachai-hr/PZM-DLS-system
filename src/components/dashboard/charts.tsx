"use client";

import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DayPoint } from "@/lib/analytics";
import { fmtDayMonth, fmtDate } from "@/lib/dates";
import { compactNum, money } from "@/lib/format";
import { PLATFORM_SERIES } from "@/lib/constants";

const axis = { fontSize: 11, fill: "var(--muted)" };

function Swatch({ color }: { color: string }) {
  return <span className="inline-block size-2.5 rounded-[3px]" style={{ background: color }} />;
}

export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex flex-wrap gap-4 text-xs text-ink-2">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5">
          <Swatch color={i.color} />
          {i.label}
        </span>
      ))}
    </div>
  );
}

type TipPayload = { name?: string; value?: number; color?: string; dataKey?: string | number; payload?: DayPoint };

function TrendTip({ active, payload }: { active?: boolean; payload?: TipPayload[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload!;
  return (
    <div className="min-w-44 rounded-xl border border-line bg-card px-3 py-2 text-xs shadow-xl">
      <div className="mb-1.5 font-medium text-ink">{fmtDate(p.date)}</div>
      {payload.map((x) => (
        <div key={String(x.dataKey)} className="flex items-center justify-between gap-4 py-0.5 text-ink-2">
          <span className="inline-flex items-center gap-1.5">
            <Swatch color={x.color!} />
            {x.name}
          </span>
          <span className="num text-ink">{money(x.value ?? 0)}</span>
        </div>
      ))}
      <div className="mt-1 flex justify-between border-t border-line pt-1 font-medium text-ink">
        <span>รวม</span>
        <span className="num">{money(p.total)}</span>
      </div>
    </div>
  );
}

export function SalesTrendChart({ data }: { data: DayPoint[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }} barCategoryGap="22%">
          <CartesianGrid vertical={false} stroke="var(--grid)" />
          <XAxis dataKey="date" tickFormatter={fmtDayMonth} tick={axis} tickLine={false} axisLine={{ stroke: "var(--line)" }} minTickGap={16} />
          <YAxis tickFormatter={(v) => compactNum(v)} tick={axis} tickLine={false} axisLine={false} width={44} />
          <Tooltip content={<TrendTip />} cursor={{ fill: "var(--card-2)" }} />
          <Bar dataKey="inStore" name="หน้าร้าน" stackId="s" fill="var(--s-instore)" maxBarSize={24} stroke="var(--card)" strokeWidth={1} />
          <Bar dataKey="delivery" name="เดลิเวอรี่" stackId="s" fill="var(--s-delivery)" maxBarSize={24} radius={[4, 4, 0, 0]} stroke="var(--card)" strokeWidth={1} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

type PlatformBar = { label: string; gross: number };

export function PlatformBarChart({ data }: { data: PlatformBar[] }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 64, left: 0, bottom: 0 }} barCategoryGap="28%">
          <CartesianGrid horizontal={false} stroke="var(--grid)" />
          <XAxis type="number" tickFormatter={(v) => compactNum(v)} tick={axis} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="label" tick={{ ...axis, fill: "var(--ink-2)" }} tickLine={false} axisLine={false} width={112} />
          <Tooltip
            cursor={{ fill: "var(--card-2)" }}
            content={({ active, payload }) =>
              active && payload?.length ? (
                <div className="rounded-xl border border-line bg-card px-3 py-2 text-xs shadow-xl">
                  <div className="font-medium">{(payload[0].payload as PlatformBar).label}</div>
                  <div className="num text-ink-2">{money(Number(payload[0].value))}</div>
                </div>
              ) : null
            }
          />
          <Bar dataKey="gross" fill="var(--s-delivery)" maxBarSize={22} radius={[0, 4, 4, 0]}>
            <LabelList dataKey="gross" position="right" formatter={(v) => compactNum(Number(v))} style={{ fontSize: 11, fill: "var(--ink-2)" }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

type PlatformRow = { date: string } & Record<string, number | string>;

export function PlatformTrendChart({ data }: { data: PlatformRow[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }} barCategoryGap="22%">
          <CartesianGrid vertical={false} stroke="var(--grid)" />
          <XAxis dataKey="date" tickFormatter={fmtDayMonth} tick={axis} tickLine={false} axisLine={{ stroke: "var(--line)" }} minTickGap={16} />
          <YAxis tickFormatter={(v) => compactNum(v)} tick={axis} tickLine={false} axisLine={false} width={44} />
          <Tooltip
            cursor={{ fill: "var(--card-2)" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const row = payload[0].payload as PlatformRow;
              const total = PLATFORM_SERIES.reduce((a, s) => a + Number(row[s.key] || 0), 0);
              return (
                <div className="min-w-44 rounded-xl border border-line bg-card px-3 py-2 text-xs shadow-xl">
                  <div className="mb-1.5 font-medium">{fmtDate(row.date)}</div>
                  {[...payload].reverse().map((x) => (
                    <div key={String(x.dataKey)} className="flex justify-between gap-4 py-0.5 text-ink-2">
                      <span className="inline-flex items-center gap-1.5">
                        <Swatch color={String(x.color)} />
                        {x.name}
                      </span>
                      <span className="num text-ink">{money(Number(x.value))}</span>
                    </div>
                  ))}
                  <div className="mt-1 flex justify-between border-t border-line pt-1 font-medium">
                    <span>รวม</span>
                    <span className="num">{money(total)}</span>
                  </div>
                </div>
              );
            }}
          />
          {PLATFORM_SERIES.map((s, i) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label}
              stackId="p"
              fill={s.color}
              maxBarSize={24}
              stroke="var(--card)"
              strokeWidth={1}
              radius={i === PLATFORM_SERIES.length - 1 ? [4, 4, 0, 0] : undefined}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
