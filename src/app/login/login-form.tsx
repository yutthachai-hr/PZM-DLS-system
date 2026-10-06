"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { login } from "@/app/actions/auth";
import { Button, Field, Input } from "@/components/ui";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form action={action} className="space-y-4">
      <Field label="ชื่อผู้ใช้">
        <Input name="username" autoComplete="username" autoCapitalize="none" required autoFocus />
      </Field>
      <Field label="รหัสผ่าน">
        <Input name="password" type="password" autoComplete="current-password" required />
      </Field>
      {state?.error && (
        <p role="alert" className="rounded-xl bg-bad-soft px-3 py-2 text-sm text-bad">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        เข้าสู่ระบบ
      </Button>
    </form>
  );
}
