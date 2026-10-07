import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { LineButton } from "@/components/line-button";
import { db } from "@/lib/db";
import { lineConfigured } from "@/lib/line";
import { readSignupProfile } from "@/lib/signup";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "สมัครใช้งาน" };

export default async function SignupPage() {
  const profile = await readSignupProfile();

  // Step 1: verify identity with LINE first.
  if (!profile) {
    return (
      <AuthShell title="สมัครใช้งาน" sub="ยืนยันตัวตนด้วย LINE ก่อน แล้วกรอกเบอร์และสาขา">
        <LineButton href="/api/auth/line?mode=signup" disabled={!lineConfigured()}>
          สมัครด้วย LINE
        </LineButton>
        <p className="mt-6 text-center text-sm text-muted">
          มีบัญชีแล้ว?{" "}
          <Link href="/login" className="font-bold text-brand hover:underline">
            เข้าสู่ระบบ
          </Link>
        </p>
      </AuthShell>
    );
  }

  // Step 2: details → request waits for a manager/admin.
  const branches = await db.branch.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } });
  return (
    <AuthShell title="ข้อมูลพนักงาน" sub="ส่งแล้วรอผู้จัดการอนุมัติ">
      <SignupForm profile={{ name: profile.name, picture: profile.picture }} branches={branches} />
    </AuthShell>
  );
}
