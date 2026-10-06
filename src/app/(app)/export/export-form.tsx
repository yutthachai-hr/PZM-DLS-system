"use client";

import { useState } from "react";
import { Bike, FileSpreadsheet, Printer } from "lucide-react";
import { AnchorButton, Field, Input, Select, cx } from "@/components/ui";

export function ExportForm({
  branches,
  defaultFrom,
  defaultTo,
  yesterday,
}: {
  branches: { id: string; name: string }[] | null;
  defaultFrom: string;
  defaultTo: string;
  yesterday: string;
}) {
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [branch, setBranch] = useState("");
  const [status, setStatus] = useState("");
  const qs = new URLSearchParams({ from, to, ...(branch && { branch }), ...(status && { status }) }).toString();
  const presets = [
    { label: "เมื่อวาน", from: yesterday, to: yesterday },
    { label: "เดือนนี้", from: defaultFrom, to: defaultTo },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {presets.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => {
              setFrom(p.from);
              setTo(p.to);
            }}
            className={cx("rounded-full border px-3 py-1 text-sm", from === p.from && to === p.to ? "border-brand bg-brand-soft text-brand" : "border-line hover:bg-card-2")}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="ตั้งแต่">
          <Input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
        </Field>
        <Field label="ถึง">
          <Input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
        </Field>
        {branches && (
          <Field label="สาขา">
            <Select value={branch} onChange={(e) => setBranch(e.target.value)}>
              <option value="">ทุกสาขา</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field label="สถานะ">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">ทั้งหมด (รวมร่าง)</option>
            <option value="SENT">ส่งแล้ว + อนุมัติ</option>
            <option value="APPROVED">อนุมัติแล้วเท่านั้น</option>
          </Select>
        </Field>
      </div>

      <div className="grid gap-3 border-t border-line pt-5 sm:grid-cols-3">
        <AnchorButton href={`/api/export/excel?${qs}`} variant="primary" size="lg">
          <FileSpreadsheet className="size-5" /> ยอดขาย Excel
        </AnchorButton>
        <AnchorButton href={`/export/print?${qs}`} target="_blank" size="lg">
          <Printer className="size-5" /> สรุป PDF
        </AnchorButton>
        <AnchorButton href={`/api/export/delivery?${qs}`} size="lg">
          <Bike className="size-5" /> เดลิเวอรี่ Excel
        </AnchorButton>
      </div>
      <p className="text-xs text-muted">Excel: ชีต “สรุป” + 1 ชีตต่อวัน (รูปแบบเดียวกับฟอร์มเดิม)</p>
    </div>
  );
}
