"use client";

import { useActionState, useTransition } from "react";
import { BadgeCheck, Loader2, Phone, X } from "lucide-react";
import { approveUser, rejectUser } from "@/app/actions/users";
import { Button, Card, Field, Select } from "@/components/ui";

type Pending = {
  id: string;
  name: string;
  phone: string | null;
  linePicture: string | null;
  branchId: string | null;
  branchName: string;
  requestedAt: string;
};

export function ApprovalCard({ user, branches, canPickRole }: { user: Pending; branches: { id: string; name: string }[]; canPickRole: boolean }) {
  const [state, action, pending] = useActionState(approveUser, undefined);
  const [rejecting, startReject] = useTransition();

  if (state?.ok) return <Card className="p-5 text-sm text-good">✓ {state.message}</Card>;

  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        {user.linePicture ? (
          // eslint-disable-next-line @next/next/no-img-element -- LINE CDN avatar
          <img src={user.linePicture} alt="" className="size-12 rounded-full" />
        ) : (
          <span className="grid size-12 place-items-center rounded-full bg-cheese-soft font-bold text-warn">{user.name.slice(0, 1)}</span>
        )}
        <div className="flex-1">
          <div className="font-bold">{user.name}</div>
          <div className="text-xs text-muted">
            ขอเข้าสาขา {user.branchName} · {user.requestedAt}
          </div>
        </div>
        {user.phone && (
          <a href={`tel:${user.phone}`} className="inline-flex items-center gap-1 rounded-lg bg-card-2 px-2.5 py-1.5 text-sm hover:bg-line">
            <Phone className="size-3.5" /> {user.phone}
          </a>
        )}
      </div>

      <form action={action} className="mt-4 space-y-3">
        <input type="hidden" name="id" value={user.id} />
        {canPickRole && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="สิทธิ์">
              <Select name="role" defaultValue="STAFF">
                <option value="STAFF">พนักงาน</option>
                <option value="MANAGER">ผู้จัดการ</option>
                <option value="ADMIN">แอดมิน</option>
              </Select>
            </Field>
            <Field label="สาขา">
              <Select name="branchId" defaultValue={user.branchId ?? ""}>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        )}
        {state?.error && <p className="text-sm text-bad">{state.error}</p>}
        <div className="flex gap-2">
          <Button type="submit" className="flex-1" disabled={pending || rejecting}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <BadgeCheck className="size-4" />} อนุมัติ
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={pending || rejecting}
            onClick={() =>
              confirm(`ปฏิเสธคำขอของ ${user.name}?`) &&
              startReject(async () => {
                const r = await rejectUser(user.id);
                if (r?.error) alert(r.error);
              })
            }
          >
            <X className="size-4" /> ปฏิเสธ
          </Button>
        </div>
      </form>
    </Card>
  );
}
