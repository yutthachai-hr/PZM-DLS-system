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
    select: { id: true, name: true, username: true, role: true, branchId: true, active: true, branch: true },
  });
  return user?.active ? user : null;
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(...roles: Role[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/");
  return user;
}

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
