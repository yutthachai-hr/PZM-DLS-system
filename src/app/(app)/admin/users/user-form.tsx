"use client";

import { useActionState, useState } from "react";
import { saveUser } from "@/app/actions/admin";
import { Button, Field, Input, Select } from "@/components/ui";
import { ROLE_LABEL } from "@/lib/constants";

type U = { id: string; name: string; username: string; role: keyof typeof ROLE_LABEL; branchId: string | null; active: boolean };

export function UserForm({ branches, user }: { branches: { id: string; name: string }[]; user?: U }) {
  const [state, action, pending] = useActionState(saveUser, undefined);
  const [role, setRole] = useState<U["role"]>(user?.role ?? "STAFF");

  return (
    <form action={action} className="space-y-3" key={!user ? state?.nonce : undefined}>
      {user && <input type="hidden" name="id" value={user.id} />}
      <div className="grid grid-cols-2 gap-3">
        <Field label="ชื่อ">
          <Input name="name" defaultValue={user?.name} required />
        </Field>
        <Field label="ชื่อผู้ใช้">
          <Input name="username" defaultValue={user?.username} autoCapitalize="none" required />
        </Field>
        <Field label="สิทธิ์">
          <Select name="role" value={role} onChange={(e) => setRole(e.target.value as U["role"])}>
            {Object.entries(ROLE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="สาขา">
          <Select name="branchId" defaultValue={user?.branchId ?? ""} disabled={role === "ADMIN"}>
            <option value="">{role === "ADMIN" ? "ทุกสาขา" : "เลือกสาขา"}</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={user ? "รหัสผ่านใหม่" : "รหัสผ่าน"} hint="อย่างน้อย 8 ตัว" className="col-span-2">
          <Input name="password" type="password" autoComplete="new-password" placeholder={user ? "เว้นว่าง = ไม่เปลี่ยน" : ""} required={!user} />
        </Field>
      </div>
      <div className="flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="active" defaultChecked={user?.active ?? true} className="size-4 accent-[var(--brand)]" />
          ใช้งาน
        </label>
        <div className="flex items-center gap-3">
          {state?.error && <span className="text-sm text-bad">{state.error}</span>}
          {state?.ok && <span className="text-sm text-good">{state.message}</span>}
          <Button size="sm" disabled={pending}>
            {user ? "บันทึก" : "เพิ่มผู้ใช้"}
          </Button>
        </div>
      </div>
    </form>
  );
}
