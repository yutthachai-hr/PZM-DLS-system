import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { LineButton } from "@/components/line-button";
import { lineConfigured } from "@/lib/line";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "เข้าสู่ระบบ" };

const NOTICE: Record<string, { tone: "good" | "warn" | "bad"; text: string }> = {
  signup: { tone: "good", text: "ส่งคำขอแล้ว รอผู้จัดการอนุมัติ แล้วเข้าด้วย LINE ได้เลย" },
  pending: { tone: "warn", text: "บัญชีรออนุมัติจากผู้จัดการ" },
  disabled: { tone: "bad", text: "บัญชีนี้ถูกปิดใช้งาน ติดต่อผู้จัดการ" },
  line_cancel: { tone: "warn", text: "ยกเลิกการเข้าสู่ระบบด้วย LINE" },
  line_failed: { tone: "bad", text: "เข้าด้วย LINE ไม่สำเร็จ ลองใหม่อีกครั้ง" },
  line_not_configured: { tone: "bad", text: "ยังไม่ได้ตั้งค่า LINE Login" },
};
const toneCls = { good: "bg-good-soft text-good", warn: "bg-cheese-soft text-warn", bad: "bg-bad-soft text-bad" };
const toneIcon = { good: CheckCircle2, warn: Clock, bad: XCircle };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ s?: string; e?: string }> }) {
  const sp = await searchParams;
  const notice = NOTICE[sp.s ?? ""] ?? NOTICE[sp.e ?? ""];
  const line = lineConfigured();

  return (
    <AuthShell title="เข้าสู่ระบบ" sub="ใช้ LINE ของคุณ ไม่ต้องจำรหัสผ่าน">
      {notice && (
        <div role="status" className={`mb-5 flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm ${toneCls[notice.tone]}`}>
          {(() => {
            const Icon = toneIcon[notice.tone];
            return <Icon className="mt-0.5 size-4 shrink-0" />;
          })()}
          {notice.text}
        </div>
      )}

      <LineButton href="/api/auth/line?mode=login" disabled={!line}>
        เข้าสู่ระบบด้วย LINE
      </LineButton>

      <p className="mt-4 text-center text-sm text-muted">
        พนักงานใหม่?{" "}
        <Link href="/signup" className="font-bold text-brand hover:underline">
          สมัครใช้งาน
        </Link>
      </p>

      <details className="group mt-8 border-t border-line pt-5" open={!line}>
        <summary className="cursor-pointer list-none text-center text-xs text-muted hover:text-ink-2">
          เข้าด้วยชื่อผู้ใช้ / รหัสผ่าน <span className="group-open:hidden">▾</span>
          <span className="hidden group-open:inline">▴</span>
        </summary>
        <div className="mt-4">
          <LoginForm />
        </div>
      </details>
    </AuthShell>
  );
}
