/**
 * npm run seed            → branches + starter accounts (idempotent)
 * SEED_DEMO=1 npm run seed → also 60 days of sample reports (skips days that already exist)
 *
 * Starter password comes from SEED_PASSWORD (see .env.example). Change it after first login.
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient, type PaymentMethod, type Platform } from "@prisma/client";

const db = new PrismaClient();

const BRANCHES = [
  { code: "SKV23", name: "สุขุมวิท 23" },
  { code: "SRS", name: "สารสิน" },
];

const USERS = [
  { username: "admin", name: "ผู้ดูแลระบบ", role: "ADMIN" as const, branch: null },
  { username: "manager.skv", name: "ผู้จัดการ สุขุมวิท", role: "MANAGER" as const, branch: "SKV23" },
  { username: "staff.skv", name: "พนักงาน สุขุมวิท", role: "STAFF" as const, branch: "SKV23" },
  { username: "manager.srs", name: "ผู้จัดการ สารสิน", role: "MANAGER" as const, branch: "SRS" },
  { username: "staff.srs", name: "พนักงาน สารสิน", role: "STAFF" as const, branch: "SRS" },
];

// deterministic pseudo-random so demo data is stable between runs
let s = 42;
const rand = () => ((s = (s * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
const between = (a: number, b: number) => a + rand() * (b - a);
const r2 = (n: number) => Math.round(n * 100) / 100;

function bangkokToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());
}

async function main() {
  const password = process.env.SEED_PASSWORD;
  if (!password || password.length < 8) throw new Error("Set SEED_PASSWORD (8+ chars) in .env before seeding");
  const hash = await bcrypt.hash(password, 10);

  const branchIds: Record<string, string> = {};
  for (const b of BRANCHES) {
    const row = await db.branch.upsert({ where: { code: b.code }, update: {}, create: b });
    branchIds[b.code] = row.id;
  }

  const userIds: Record<string, string> = {};
  for (const u of USERS) {
    const row = await db.user.upsert({
      where: { username: u.username },
      update: {},
      create: { username: u.username, name: u.name, role: u.role, passwordHash: hash, branchId: u.branch ? branchIds[u.branch] : null },
    });
    userIds[u.username] = row.id;
  }
  console.log(`✓ ${BRANCHES.length} branches, ${USERS.length} users`);

  if (process.env.SEED_DEMO !== "1") return;

  const today = bangkokToday();
  let created = 0;
  for (const code of Object.keys(branchIds)) {
    const scale = code === "SKV23" ? 1 : 0.7;
    const staff = userIds[code === "SKV23" ? "staff.skv" : "staff.srs"];
    const manager = userIds[code === "SKV23" ? "manager.skv" : "manager.srs"];
    for (let back = 60; back >= 1; back--) {
      const d = new Date(`${today}T00:00:00Z`);
      d.setUTCDate(d.getUTCDate() - back);
      const weekend = [0, 5, 6].includes(d.getUTCDay()) ? 1.35 : 1;
      const k = scale * weekend;

      const exists = await db.dailyReport.findUnique({ where: { branchId_date: { branchId: branchIds[code], date: d } } });
      if (exists) continue;

      const cashPos = r2(between(9000, 16000) * k);
      const short = rand() < 0.2 ? r2(between(-250, 120)) : 0;
      const payments: { method: PaymentMethod; posAmount: number; countedAmount: number; note?: string }[] = [
        { method: "CASH", posAmount: cashPos, countedAmount: r2(cashPos + short), note: Math.abs(short) > 100 ? "ทอนเงินผิด" : undefined },
        { method: "QR", posAmount: r2(between(7000, 13000) * k), countedAmount: 0 },
        { method: "EDC", posAmount: r2(between(3000, 9000) * k), countedAmount: 0 },
        { method: "COUPON", posAmount: r2(between(200, 1200) * k), countedAmount: 0 },
      ];
      for (const p of payments.slice(1)) p.countedAmount = p.posAmount;

      const plat = (platform: Platform, lo: number, hi: number, gp: number) => {
        const orders = Math.round(between(lo, hi) * k);
        const gross = r2(orders * between(420, 620));
        const cancelledOrders = rand() < 0.35 ? Math.ceil(between(0, 3)) : 0;
        return {
          platform,
          gross,
          net: r2(gross * (1 - gp)),
          orders,
          cancelledOrders,
          cancelledAmount: r2(cancelledOrders * between(380, 650)),
          note: cancelledOrders ? "ลูกค้ายกเลิก / ไรเดอร์ไม่รับ" : undefined,
        };
      };
      const deliveries = [plat("GRAB", 14, 30, 0.3), plat("LINEMAN", 10, 24, 0.3), plat("SHOPEE", 2, 9, 0.25), plat("FOODPANDA_OTHER", 0, 4, 0.3)];

      const approved = back > 2;
      await db.dailyReport.create({
        data: {
          branchId: branchIds[code],
          date: d,
          recorderId: staff,
          billStart: String(1000 + back * 120).padStart(6, "0"),
          billEnd: String(1000 + back * 120 + Math.round(between(70, 140))).padStart(6, "0"),
          float: 2000,
          status: approved ? "APPROVED" : "SUBMITTED",
          submittedAt: new Date(d.getTime() + 15 * 3600_000),
          approvedById: approved ? manager : null,
          approvedAt: approved ? new Date(d.getTime() + 16 * 3600_000) : null,
          chkZReport: true,
          chkEdcSlip: true,
          chkTransfer: rand() > 0.1,
          chkPayIn: rand() > 0.1,
          payments: { create: payments },
          deliveries: { create: deliveries },
          auditLogs: {
            create: [{ userId: staff, action: "CREATE_SUBMIT" }, ...(approved ? [{ userId: manager, action: "APPROVE" }] : [])],
          },
        },
      });
      created++;
    }
  }
  console.log(`✓ ${created} demo reports`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
