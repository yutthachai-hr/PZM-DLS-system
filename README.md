# 🍕 Pizza Mania · Daily Sales

ระบบบันทึกและสรุปยอดขายรายวันของร้าน Pizza Mania แทนไฟล์ `ตารางสรุปยอดขายรายวัน (Daily Sales Report).xlsx`

- **บันทึกยอด**: หน้าร้าน (เงินสด / QR / EDC / คูปอง: ยอด POS เทียบกับยอดนับจริง) และเดลิเวอรี่ (การ์ดใหญ่สำหรับ Grab, LINE MAN: ยอดขาย, ออเดอร์, ออเดอร์ยกเลิก) พร้อมสรุปสิ้นวันและ checklist เอกสาร
- **แดชบอร์ด**: ยอดรวม, สัดส่วนหน้าร้าน/เดลิเวอรี่, เงินขาด/เกิน, ออเดอร์ยกเลิก, กราฟรายวัน, สาขาที่ยังไม่ส่งยอด
- **ประวัติ**: ค้นหาตามวันที่ สาขา สถานะ ผู้บันทึก หรือเลขบิล และดูประวัติการแก้ไขทุกครั้ง
- **ดึงรายงาน**: Excel (แต่ละวันใช้รูปแบบเดียวกับฟอร์มเดิม พร้อมชีตสรุป), PDF (พิมพ์จากเบราว์เซอร์), Excel เฉพาะเดลิเวอรี่
- **สิทธิ์ 3 ระดับ**: พนักงาน / ผู้จัดการ (อนุมัติ) / แอดมิน (ทุกสาขา, จัดการผู้ใช้และสาขา)

สูตรคำนวณทั้งหมดอยู่ที่ [`src/lib/calc.ts`](src/lib/calc.ts) และตรงกับไฟล์ Excel เดิม:
`ผลต่าง = นับจริง − POS` · `ยอดขายรวม = ΣPOS หน้าร้าน + ΣGross เดลิเวอรี่` · `เงินสดนำฝาก = เงินสดนับจริง − Float`

## Stack
Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Prisma 6 + PostgreSQL · jose (session cookie) · Recharts · ExcelJS · Vitest

---

## รันบนเครื่อง (Local)

ต้องมี Node.js 20+ (ไม่ต้องติดตั้ง Docker หรือ Postgres)

```bash
npm install
cp .env.example .env          # ตั้ง AUTH_SECRET และ SEED_PASSWORD
npm run db:start              # เปิด Postgres ในเครื่อง (prisma dev) แล้วคัดลอก TCP URL ไปใส่ใน .env
npx prisma migrate dev        # สร้างตาราง
npm run seed                  # สร้างสาขาและบัญชีเริ่มต้น (หรือใช้ npm run seed:demo เพื่อใส่ข้อมูลตัวอย่าง 60 วัน)
npm run dev                   # เปิด http://localhost:3000
```

> ฐานข้อมูล local ที่เปิดด้วย `prisma dev` ต้องมี `&pgbouncer=true` ต่อท้าย `DATABASE_URL` (ตามตัวอย่างใน `.env.example`)

**บัญชีเริ่มต้น** (รหัสผ่าน = `SEED_PASSWORD` ใน `.env` ให้เปลี่ยนหลังเข้าระบบครั้งแรก)

| username | สิทธิ์ | สาขา |
|---|---|---|
| `admin` | แอดมิน | ทุกสาขา |
| `manager.skv` / `staff.skv` | ผู้จัดการ / พนักงาน | สุขุมวิท 23 |
| `manager.srs` / `staff.srs` | ผู้จัดการ / พนักงาน | สารสิน |

### ให้เครื่องอื่นในร้านเข้าใช้ (LAN ชั่วคราว)
```bash
npm run build && npm start -- -H 0.0.0.0
```
จากนั้นเปิด `http://<IP เครื่องนี้>:3000` จากเครื่องอื่น ถ้าไม่มี HTTPS ให้ตั้ง `COOKIE_SECURE="false"` ใน `.env`

---

## Deploy ขึ้น Cloud (ใช้ได้ทุกสาขา)

1. **GitHub**: สร้าง repo เปล่า แล้วรัน
   ```bash
   git remote add origin https://github.com/<org>/pizzamania-daily-sales.git
   git push -u origin main
   ```
2. **Vercel**: เลือก Add New → Project → Import repo
3. **Database**: ในโปรเจกต์ Vercel ไปที่ Storage → เพิ่ม **Neon Postgres** (หรือใช้ Supabase) แล้วตั้ง Environment Variables
   - `DATABASE_URL`: pooled URL ต่อท้ายด้วย `?sslmode=require&pgbouncer=true`
   - `DIRECT_URL`: non-pooled URL (ใช้ตอน migrate)
   - `AUTH_SECRET`: สุ่มใหม่ด้วย `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`
4. กด **Deploy**: สคริปต์ `vercel-build` จะรัน `prisma migrate deploy` ให้อัตโนมัติ
5. Seed ครั้งแรก (รันจากเครื่องตัวเองโดยชี้ไปที่ DB บน cloud):
   ```bash
   DATABASE_URL="<neon direct url>" SEED_PASSWORD="<รหัสชั่วคราว>" npm run seed
   ```
6. เข้าระบบด้วย `admin` เปลี่ยนรหัสผ่าน แล้วเพิ่มสาขาและผู้ใช้จริงในเมนู Admin

---

## คำสั่งที่ใช้บ่อย
| คำสั่ง | ใช้ทำอะไร |
|---|---|
| `npm test` | unit test สูตรคำนวณ |
| `npm run lint` / `npm run typecheck` | ตรวจโค้ด |
| `npm run db:studio` | เปิดดูข้อมูลในฐานข้อมูล |
| `npm run db:stop` | ปิดฐานข้อมูล local |

## ปรับแต่งแบรนด์
สีทั้งหมดเป็น CSS token อยู่ใน [`src/app/globals.css`](src/app/globals.css) (`--brand`, `--cheese`, `--ink` …) และโลโก้ชั่วคราวอยู่ที่ `public/logo.svg` กับ `src/app/icon.svg` เปลี่ยนเป็นไฟล์จริงได้ทันที

## โครงสร้าง
```
prisma/schema.prisma          Branch, User, DailyReport, PaymentLine, DeliveryLine, AuditLog
src/lib/calc.ts               สูตรคำนวณ (+ calc.test.ts)
src/lib/permissions.ts        สิทธิ์ Staff / Manager / Admin
src/lib/excel.ts              สร้างไฟล์ Excel
src/app/actions/              server actions (login, บันทึก/อนุมัติ, admin)
src/app/(app)/                หน้าแดชบอร์ด, daily, delivery, export, admin
src/components/daily-form/    ฟอร์มบันทึกยอด + การ์ดเดลิเวอรี่
```

แหล่งอ้างอิงที่ใช้ออกแบบ: [docs/REFERENCES.md](docs/REFERENCES.md)
