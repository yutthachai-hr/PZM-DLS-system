// Vercel build.
// - Production: check env, run migrations (+ optional first-run seed), then build.
// - Preview (PR branches): build only. Previews share the production DATABASE_URL by default,
//   so they must never migrate or seed it before the PR is merged.
import { execSync } from "node:child_process";

const env = { ...process.env };
// Neon/Prisma Postgres integrations set an unpooled URL instead of DIRECT_URL.
env.DIRECT_URL ||= env.DATABASE_URL_UNPOOLED || env.POSTGRES_URL_NON_POOLING || env.DATABASE_URL;
const isProd = env.VERCEL_ENV === "production";

const run = (cmd) => execSync(cmd, { stdio: "inherit", env });

if (isProd) {
  const missing = ["DATABASE_URL", "AUTH_SECRET"].filter((k) => !env[k]);
  if (missing.length) {
    console.error(`\n✗ Missing environment variables: ${missing.join(", ")}\n  Add them in Vercel → Settings → Environment Variables, then redeploy.\n`);
    process.exit(1);
  }
} else {
  console.log(`ℹ ${env.VERCEL_ENV ?? "local"} build: skipping migrations and seed`);
}

run("npx prisma generate");
if (isProd) {
  run("npx prisma migrate deploy");
  // Optional first-run seed: creates branches + starter accounts if they don't exist.
  // Never overwrites existing users/passwords, so it's safe to leave set.
  if (env.SEED_PASSWORD) run("npx tsx prisma/seed.ts");
}
run("npx next build");
