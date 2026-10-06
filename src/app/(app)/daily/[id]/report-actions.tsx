"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Loader2, LockOpen, Trash2 } from "lucide-react";
import { approveReport, deleteDraft, reopenReport } from "@/app/actions/reports";
import { Button } from "@/components/ui";

export function ReportActions({ id, approve, reopen, deletable }: { id: string; approve: boolean; reopen: boolean; deletable: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, after?: string) =>
    start(async () => {
      const res = await fn();
      if (!res.ok) return alert(res.error);
      if (after) router.push(after);
      router.refresh();
    });

  return (
    <>
      {approve && (
        <Button size="sm" disabled={pending} onClick={() => run(() => approveReport(id))}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <BadgeCheck className="size-4" />} อนุมัติ
        </Button>
      )}
      {reopen && (
        <Button size="sm" variant="secondary" disabled={pending} onClick={() => confirm("ปลดล็อกให้แก้ไขได้?") && run(() => reopenReport(id))}>
          <LockOpen className="size-4" /> ปลดล็อก
        </Button>
      )}
      {deletable && (
        <Button size="sm" variant="danger" disabled={pending} onClick={() => confirm("ลบร่างนี้?") && run(() => deleteDraft(id), "/daily")}>
          <Trash2 className="size-4" /> ลบร่าง
        </Button>
      )}
    </>
  );
}
