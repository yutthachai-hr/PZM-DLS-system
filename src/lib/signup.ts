import "server-only";
import { cookies } from "next/headers";
import { LINE_SIGNUP_COOKIE, type LineProfile } from "./line";
import { verifyTemp } from "./session-token";

/** Thai mobile number → 10 digits starting with 0 (accepts +66 / spaces / dashes). */
export const normalizePhone = (raw: string) => {
  const d = raw.replace(/\D/g, "");
  return d.startsWith("66") && d.length === 11 ? `0${d.slice(2)}` : d;
};

/** The verified LINE profile waiting to sign up (set by /api/auth/line/callback). */
export async function readSignupProfile() {
  return verifyTemp<LineProfile>("line-signup", (await cookies()).get(LINE_SIGNUP_COOKIE)?.value);
}
