"use server";

import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/dal";

export type FormState = { ok?: boolean; error?: string; message?: string; nonce?: number } | undefined;

const dup = (e: unknown) => e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";

// ---------- Branches ----------

const branchSchema = z.object({
  id: z.string().optional(),
  code: z.string().trim().min(1, "ใส่รหัสสาขา").max(20).regex(/^[A-Za-z0-9_-]+$/, "รหัสใช้ A-Z, 0-9, - เท่านั้น"),
  name: z.string().trim().min(1, "ใส่ชื่อสาขา").max(80),
  active: z.boolean(),
});

export async function saveBranch(_: FormState, form: FormData): Promise<FormState> {
  await requireRole("ADMIN");
  const parsed = branchSchema.safeParse({
    id: form.get("id") || undefined,
    code: form.get("code"),
    name: form.get("name"),
    active: form.get("active") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const { id, ...data } = parsed.data;
  data.code = data.code.toUpperCase();
  try {
    if (id) await db.branch.update({ where: { id }, data });
    else await db.branch.create({ data });
  } catch (e) {
    if (dup(e)) return { error: "รหัสสาขาซ้ำ" };
    throw e;
  }
  revalidatePath("/admin/branches");
  return { ok: true, message: "บันทึกแล้ว" };
}

// ---------- Users ----------

const userSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "ใส่ชื่อ").max(80),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "ชื่อผู้ใช้อย่างน้อย 3 ตัว")
    .max(30)
    .regex(/^[a-z0-9._-]+$/, "ชื่อผู้ใช้ใช้ a-z, 0-9, . _ - เท่านั้น"),
  role: z.enum(["STAFF", "MANAGER", "ADMIN"]),
  branchId: z.string().optional(),
  active: z.boolean(),
  password: z.string().optional(),
});

export async function saveUser(_: FormState, form: FormData): Promise<FormState> {
  const me = await requireRole("ADMIN");
  const parsed = userSchema.safeParse({
    id: form.get("id") || undefined,
    name: form.get("name"),
    username: form.get("username"),
    role: form.get("role"),
    branchId: form.get("branchId") || undefined,
    active: form.get("active") === "on",
    password: form.get("password") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const { id, password, ...data } = parsed.data;

  if (data.role !== "ADMIN" && !data.branchId) return { error: "พนักงาน/ผู้จัดการต้องมีสาขา" };
  if (data.role === "ADMIN") data.branchId = undefined;
  if (password !== undefined && password.length < 8) return { error: "รหัสผ่านอย่างน้อย 8 ตัว" };
  if (!id && !password) return { error: "ตั้งรหัสผ่าน" };
  if (id === me.id && (!data.active || data.role !== "ADMIN")) return { error: "แก้สิทธิ์ตัวเองไม่ได้" };

  const record = {
    ...data,
    branchId: data.branchId ?? null,
    ...(password ? { passwordHash: await bcrypt.hash(password, 10) } : {}),
  };
  try {
    if (id) await db.user.update({ where: { id }, data: record });
    else await db.user.create({ data: { ...record, passwordHash: record.passwordHash! } });
  } catch (e) {
    if (dup(e)) return { error: "ชื่อผู้ใช้ซ้ำ" };
    throw e;
  }
  revalidatePath("/admin/users");
  return { ok: true, message: password && id ? "บันทึก + เปลี่ยนรหัสแล้ว" : "บันทึกแล้ว", nonce: Date.now() };
}
