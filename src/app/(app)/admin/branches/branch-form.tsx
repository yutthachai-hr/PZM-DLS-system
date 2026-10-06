"use client";

import { useActionState } from "react";
import { saveBranch } from "@/app/actions/admin";
import { Button, Field, Input, cx } from "@/components/ui";

export function BranchForm({ branch }: { branch?: { id: string; code: string; name: string; active: boolean } }) {
  const [state, action, pending] = useActionState(saveBranch, undefined);
  return (
    <form action={action} className="space-y-3">
      {branch && <input type="hidden" name="id" value={branch.id} />}
      <div className="grid grid-cols-[110px_1fr] gap-3">
        <Field label="รหัส">
          <Input name="code" defaultValue={branch?.code} placeholder="SKV23" required className="uppercase" />
        </Field>
        <Field label="ชื่อสาขา">
          <Input name="name" defaultValue={branch?.name} placeholder="สุขุมวิท 23" required />
        </Field>
      </div>
      <div className="flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="active" defaultChecked={branch?.active ?? true} className="size-4 accent-[var(--brand)]" />
          เปิดใช้งาน
        </label>
        <div className="flex items-center gap-3">
          {state?.error && <span className="text-sm text-bad">{state.error}</span>}
          {state?.ok && <span className="text-sm text-good">{state.message}</span>}
          <Button size="sm" variant={branch ? "secondary" : "primary"} disabled={pending} className={cx(!branch && "px-5")}>
            {branch ? "บันทึก" : "เพิ่ม"}
          </Button>
        </div>
      </div>
    </form>
  );
}
