"use client";

import { useActionState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { signup } from "@/app/actions/signup";
import { Button, Field, Input, Select } from "@/components/ui";

export function SignupForm({ profile, branches }: { profile: { name: string; picture?: string }; branches: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(signup, undefined);
  return (
    <form action={action} className="space-y-4">
      <div className="flex items-center gap-3 rounded-2xl bg-good-soft px-4 py-3 text-sm">
        {profile.picture ? (
          // eslint-disable-next-line @next/next/no-img-element -- LINE CDN avatar, tiny
          <img src={profile.picture} alt="" className="size-10 rounded-full" />
        ) : (
          <span className="grid size-10 place-items-center rounded-full bg-[#06c755] font-bold text-white">L</span>
        )}
        <div className="flex-1">
          <div className="font-bold">{profile.name || "LINE"}</div>
          <div className="text-xs text-good">ยืนยัน LINE แล้ว</div>
        </div>
        <CheckCircle2 className="size-5 text-good" />
      </div>
      <Field label="ชื่อ-นามสกุล">
        <Input name="name" defaultValue={profile.name} required autoComplete="name" />
      </Field>
      <Field label="เบอร์มือถือ">
        <Input name="phone" type="tel" inputMode="tel" placeholder="08x-xxx-xxxx" required autoComplete="tel" />
      </Field>
      <Field label="สาขา">
        <Select name="branchId" required defaultValue="">
          <option value="" disabled>
            เลือกสาขา
          </option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </Select>
      </Field>
      {state?.error && (
        <p role="alert" className="rounded-xl bg-bad-soft px-3 py-2 text-sm text-bad">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        ส่งคำขอ
      </Button>
    </form>
  );
}
