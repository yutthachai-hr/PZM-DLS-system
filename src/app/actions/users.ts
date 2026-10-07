"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/dal";
import { isAdmin, isManagerUp } from "@/lib/permissions";
import { normalizePhone } from "@/lib/signup";

export type ActionState = { ok?: boolean; error?: string; message?: string } | undefined;

/** Pending sign-up the current user may decide on: admins any, managers their own branch. */
async function pendingFor(id: string) {
  const me = await requireUser();
  if (!isManagerUp(me)) return { me, target: null };
  const target = await db.user.findFirst({
    where: { id, pending: true, ...(isAdmin(me) ? {} : { branchId: me.branchId ?? "__none__" }) },
  });
  return { me, target };
}

const approveSchema = z.object({
  id: z.string().min(1),
  role: z.enum(["STAFF", "MANAGER", "ADMIN"]).optional(),
  branchId: z.string().optional(),
});

export async function approveUser(_: ActionState, form: FormData): Promise<ActionState> {
  const parsed = approveSchema.safeParse({
    id: form.get("id"),
    role: form.get("role") || undefined,
    branchId: form.get("branchId") || undefined,
  });
  if (!parsed.success) return { error: "ข้อมูลไม่ถูกต้อง" };
  const { me, target } = await pendingFor(parsed.data.id);
  if (!target) return { error: "อนุมัติไม่ได้" };

  // Managers approve staff into their own branch; only admins pick role/branch.
  const role = isAdmin(me) ? (parsed.data.role ?? "STAFF") : "STAFF";
  const branchId = role === "ADMIN" ? null : isAdmin(me) ? (parsed.data.branchId ?? target.branchId) : me.branchId;
  if (role !== "ADMIN" && !branchId) return { error: "เลือกสาขา" };

  await db.user.update({
    where: { id: target.id },
    data: { pending: false, active: true, role, branchId, approvedById: me.id, approvedAt: new Date() },
  });
  revalidatePath("/", "layout");
  return { ok: true, message: `อนุมัติ ${target.name} แล้ว` };
}

export async function rejectUser(id: string): Promise<ActionState> {
  const { target } = await pendingFor(id);
  if (!target) return { error: "ทำรายการไม่ได้" };
  // A pending request owns no data yet; removing it lets the person apply again.
  await db.user.delete({ where: { id: target.id } });
  revalidatePath("/", "layout");
  return { ok: true };
}

// ---------- own profile ----------

export async function updateOwnProfile(_: ActionState, form: FormData): Promise<ActionState> {
  const me = await requireUser();
  const name = String(form.get("name") ?? "").trim();
  const rawPhone = String(form.get("phone") ?? "").trim();
  const phone = rawPhone ? normalizePhone(rawPhone) : null;
  if (!name || name.length > 80) return { error: "ใส่ชื่อ" };
  if (phone && !/^0[689]\d{8}$/.test(phone)) return { error: "เบอร์มือถือไม่ถูกต้อง" };
  await db.user.update({ where: { id: me.id }, data: { name, phone } });
  revalidatePath("/", "layout");
  return { ok: true, message: "บันทึกแล้ว" };
}

export async function changeOwnPassword(_: ActionState, form: FormData): Promise<ActionState> {
  const me = await requireUser();
  const current = String(form.get("current") ?? "");
  const next = String(form.get("next") ?? "");
  if (next.length < 8) return { error: "รหัสผ่านใหม่อย่างน้อย 8 ตัว" };
  if (next !== form.get("confirm")) return { error: "ยืนยันรหัสผ่านไม่ตรงกัน" };
  const user = await db.user.findUniqueOrThrow({ where: { id: me.id }, select: { passwordHash: true } });
  if (user.passwordHash && !(await bcrypt.compare(current, user.passwordHash))) return { error: "รหัสผ่านเดิมไม่ถูกต้อง" };
  await db.user.update({ where: { id: me.id }, data: { passwordHash: await bcrypt.hash(next, 10) } });
  return { ok: true, message: "เปลี่ยนรหัสผ่านแล้ว" };
}

export async function unlinkLine(): Promise<ActionState> {
  const me = await requireUser();
  const user = await db.user.findUniqueOrThrow({ where: { id: me.id }, select: { passwordHash: true } });
  if (!user.passwordHash) return { error: "ตั้งรหัสผ่านก่อน ไม่อย่างนั้นจะเข้าระบบไม่ได้" };
  await db.user.update({ where: { id: me.id }, data: { lineUserId: null, linePicture: null } });
  revalidatePath("/profile");
  return { ok: true };
}
