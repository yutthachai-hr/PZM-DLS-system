"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { LINE_SIGNUP_COOKIE } from "@/lib/line";
import { normalizePhone, readSignupProfile } from "@/lib/signup";

export type SignupState = { error?: string } | undefined;

const schema = z.object({
  name: z.string().trim().min(1, "ใส่ชื่อ").max(80),
  phone: z
    .string()
    .transform(normalizePhone)
    .refine((p) => /^0[689]\d{8}$/.test(p), "เบอร์มือถือไม่ถูกต้อง"),
  branchId: z.string().min(1, "เลือกสาขา"),
});

export async function signup(_: SignupState, form: FormData): Promise<SignupState> {
  const profile = await readSignupProfile();
  if (!profile) return { error: "หมดเวลา กด “สมัครด้วย LINE” ใหม่อีกครั้ง" };

  const parsed = schema.safeParse({ name: form.get("name"), phone: form.get("phone"), branchId: form.get("branchId") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const { name, phone, branchId } = parsed.data;

  const branch = await db.branch.findFirst({ where: { id: branchId, active: true }, select: { id: true } });
  if (!branch) return { error: "เลือกสาขา" };
  if (await db.user.findUnique({ where: { lineUserId: profile.sub }, select: { id: true } }))
    return { error: "LINE นี้สมัครไว้แล้ว" };

  await db.user.create({
    data: {
      name,
      phone,
      username: `line-${profile.sub.slice(-10).toLowerCase()}`,
      passwordHash: null,
      role: "STAFF",
      branchId,
      lineUserId: profile.sub,
      linePicture: profile.picture ?? null,
      pending: true,
    },
  });
  (await cookies()).delete(LINE_SIGNUP_COOKIE);
  redirect("/login?s=signup");
}
