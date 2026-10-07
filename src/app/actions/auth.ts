"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, deleteSession } from "@/lib/session";

export type LoginState = { error?: string } | undefined;

const schema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

export async function login(_: LoginState, form: FormData): Promise<LoginState> {
  const parsed = schema.safeParse({ username: form.get("username"), password: form.get("password") });
  if (!parsed.success) return { error: "กรอกชื่อผู้ใช้และรหัสผ่าน" };

  const user = await db.user.findUnique({ where: { username: parsed.data.username.toLowerCase() } });
  const ok = user?.passwordHash && (await bcrypt.compare(parsed.data.password, user.passwordHash));
  if (!user || !ok) return { error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" };
  if (user.pending) return { error: "บัญชีรออนุมัติจากผู้จัดการ" };
  if (!user.active) return { error: "บัญชีนี้ถูกปิดใช้งาน" };

  await createSession({ uid: user.id, role: user.role, branchId: user.branchId });
  redirect("/");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
