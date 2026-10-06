// Vercel build: run migrations, then build.
// Neon's Vercel integration sets DATABASE_URL (pooled) + DATABASE_URL_UNPOOLED;
// Prisma's schema expects DIRECT_URL for migrations, so map it when missing.
import { execSync } from "node:child_process";

const env = { ...process.env };
env.DIRECT_URL ||= env.DATABASE_URL_UNPOOLED || env.POSTGRES_URL_NON_POOLING || env.DATABASE_URL;

const missing = ["DATABASE_URL", "AUTH_SECRET"].filter((k) => !env[k]);
if (missing.length) {
  console.error(`\n✗ Missing environment variables: ${missing.join(", ")}\n  Add them in Vercel → Settings → Environment Variables, then redeploy.\n`);
  process.exit(1);
}

const run = (cmd) => execSync(cmd, { stdio: "inherit", env });
run("npx prisma generate");
run("npx prisma migrate deploy");
run("npx next build");
