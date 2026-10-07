import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { db } from "./db";
import { readSession } from "./session";

/** Current user, re-checked against the DB (deactivated users are logged out). */
export const getCurrentUser = cache(async () => {
  const s = await readSession();
  if (!s) return null;
  const user = await db.user.findUnique({
    where: { id: s.uid },
    select: { id: true, name: true, username: true, role: true, branchId: true, active: true, pending: true, branch: true, linePicture: true },
  });
  return user?.active && !user.pending ? user : null;
});

export async function requireUser() {
  const user = await getCurrentUser();
  // a cookie may outlive its account (disabled, deleted) — clear it instead of bouncing /login ↔ /
  if (!user) redirect((await readSession()) ? "/api/auth/logout?e=disabled" : "/login");
  return user;
}

export async function requireRole(...roles: Role[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/");
  return user;
}

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
