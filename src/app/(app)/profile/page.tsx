import type { Metadata } from "next";
import { CheckCircle2, XCircle } from "lucide-react";
import { Card, CardHeader, PageHeader } from "@/components/ui";
import { LineButton } from "@/components/line-button";
import { ROLE_LABEL } from "@/lib/constants";
import { requireUser } from "@/lib/dal";
import { db } from "@/lib/db";
import { lineConfigured } from "@/lib/line";
import { PasswordForm, ProfileForm, UnlinkLineButton } from "./profile-forms";

export const metadata: Metadata = { title: "โปรไฟล์" };

const NOTICE: Record<string, { ok: boolean; text: string }> = {
  linked: { ok: true, text: "ผูก LINE แล้ว ครั้งหน้ากด “เข้าสู่ระบบด้วย LINE” ได้เลย" },
  line_taken: { ok: false, text: "LINE นี้ผูกกับบัญชีอื่นอยู่แล้ว" },
  line_cancel: { ok: false, text: "ยกเลิกการผูก LINE" },
  line_failed: { ok: false, text: "ผูก LINE ไม่สำเร็จ ลองใหม่" },
};

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ s?: string; e?: string }> }) {
  const me = await requireUser();
  const sp = await searchParams;
  const notice = NOTICE[sp.s ?? ""] ?? NOTICE[sp.e ?? ""];
  const u = await db.user.findUniqueOrThrow({
    where: { id: me.id },
    select: { name: true, username: true, phone: true, lineUserId: true, linePicture: true, passwordHash: true },
  });

  return (
    <>
      <PageHeader title="โปรไฟล์" sub={`${ROLE_LABEL[me.role]} · ${me.branch?.name ?? "ทุกสาขา"} · @${u.username}`} />
      {notice && (
        <div className={`mb-5 flex items-center gap-2 rounded-2xl px-4 py-3 text-sm ${notice.ok ? "bg-good-soft text-good" : "bg-bad-soft text-bad"}`}>
          {notice.ok ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
          {notice.text}
        </div>
      )}
      <div className="grid max-w-4xl gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="บัญชี LINE" sub="ใช้เข้าสู่ระบบแทนรหัสผ่าน" />
          <div className="p-5">
            {u.lineUserId ? (
              <div className="flex items-center gap-3">
                {u.linePicture ? (
                  // eslint-disable-next-line @next/next/no-img-element -- LINE CDN avatar
                  <img src={u.linePicture} alt="" className="size-12 rounded-full" />
                ) : (
                  <span className="grid size-12 place-items-center rounded-full bg-[#06c755] font-bold text-white">L</span>
                )}
                <div className="flex-1">
                  <div className="font-bold text-good">ผูกแล้ว</div>
                  <div className="text-xs text-muted">เข้าสู่ระบบด้วย LINE ได้</div>
                </div>
                <UnlinkLineButton disabled={!u.passwordHash} />
              </div>
            ) : (
              <LineButton href="/api/auth/line?mode=link" disabled={!lineConfigured()}>
                ผูกบัญชี LINE
              </LineButton>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="ข้อมูลส่วนตัว" />
          <div className="p-5">
            <ProfileForm name={u.name} phone={u.phone ?? ""} />
          </div>
        </Card>

        <Card>
          <CardHeader title={u.passwordHash ? "เปลี่ยนรหัสผ่าน" : "ตั้งรหัสผ่าน (สำรอง)"} sub="ใช้เมื่อเข้า LINE ไม่ได้" />
          <div className="p-5">
            <PasswordForm hasPassword={Boolean(u.passwordHash)} username={u.username} />
          </div>
        </Card>
      </div>
    </>
  );
}
