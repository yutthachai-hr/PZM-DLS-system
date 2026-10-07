"use client";

import { useActionState, useTransition } from "react";
import { Unlink } from "lucide-react";
import { changeOwnPassword, unlinkLine, updateOwnProfile, type ActionState } from "@/app/actions/users";
import { Button, Field, Input } from "@/components/ui";

function Status({ state }: { state: ActionState }) {
  if (state?.error) return <span className="text-sm text-bad">{state.error}</span>;
  if (state?.ok) return <span className="text-sm text-good">{state.message}</span>;
  return null;
}

export function ProfileForm({ name, phone }: { name: string; phone: string }) {
  const [state, action, pending] = useActionState(updateOwnProfile, undefined);
  return (
    <form action={action} className="space-y-3">
      <Field label="ชื่อที่แสดง">
        <Input name="name" defaultValue={name} required />
      </Field>
      <Field label="เบอร์มือถือ">
        <Input name="phone" type="tel" inputMode="tel" defaultValue={phone} placeholder="08x-xxx-xxxx" />
      </Field>
      <div className="flex items-center justify-end gap-3">
        <Status state={state} />
        <Button size="sm" disabled={pending}>
          บันทึก
        </Button>
      </div>
    </form>
  );
}

export function PasswordForm({ hasPassword, username }: { hasPassword: boolean; username: string }) {
  const [state, action, pending] = useActionState(changeOwnPassword, undefined);
  return (
    <form action={action} className="space-y-3">
      {/* lets password managers pair the new password with the right account */}
      <input type="text" name="username" value={username} autoComplete="username" readOnly hidden />
      {hasPassword && (
        <Field label="รหัสผ่านเดิม">
          <Input name="current" type="password" autoComplete="current-password" required />
        </Field>
      )}
      <Field label="รหัสผ่านใหม่" hint="อย่างน้อย 8 ตัว">
        <Input name="next" type="password" autoComplete="new-password" minLength={8} required />
      </Field>
      <Field label="ยืนยันรหัสผ่านใหม่">
        <Input name="confirm" type="password" autoComplete="new-password" minLength={8} required />
      </Field>
      <div className="flex items-center justify-end gap-3">
        <Status state={state} />
        <Button size="sm" disabled={pending}>
          {hasPassword ? "เปลี่ยนรหัสผ่าน" : "ตั้งรหัสผ่าน"}
        </Button>
      </div>
    </form>
  );
}

export function UnlinkLineButton({ disabled }: { disabled: boolean }) {
  const [pending, start] = useTransition();
  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={pending || disabled}
      title={disabled ? "ตั้งรหัสผ่านก่อนยกเลิกการผูก" : undefined}
      onClick={() =>
        confirm("ยกเลิกการผูก LINE?") &&
        start(async () => {
          const r = await unlinkLine();
          if (r?.error) alert(r.error);
        })
      }
    >
      <Unlink className="size-4" /> ยกเลิกการผูก
    </Button>
  );
}
