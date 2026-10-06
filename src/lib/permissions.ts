import type { ReportStatus, Role } from "@prisma/client";

export type Actor = { id: string; role: Role; branchId: string | null };

export const isAdmin = (a: Actor) => a.role === "ADMIN";
export const isManagerUp = (a: Actor) => a.role === "MANAGER" || a.role === "ADMIN";

export function canViewBranch(a: Actor, branchId: string) {
  return isAdmin(a) || a.branchId === branchId;
}

/** Staff may edit their branch's report until it is approved; managers/admins any time. */
export function canEditReport(a: Actor, r: { branchId: string; status: ReportStatus }) {
  if (!canViewBranch(a, r.branchId)) return false;
  if (r.status === "APPROVED") return isAdmin(a);
  return true;
}

export function canApprove(a: Actor, r: { branchId: string; status: ReportStatus }) {
  return isManagerUp(a) && canViewBranch(a, r.branchId) && r.status === "SUBMITTED";
}

export function canReopen(a: Actor, r: { branchId: string; status: ReportStatus }) {
  return isAdmin(a) && r.status === "APPROVED";
}

/** Prisma `where` fragment restricting reports to what the actor may see. */
export function branchScope(a: Actor, requested?: string | null) {
  if (isAdmin(a)) return requested ? { branchId: requested } : {};
  return { branchId: a.branchId ?? "__none__" };
}
