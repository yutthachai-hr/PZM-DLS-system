import "server-only";
import { cookies } from "next/headers";
import { encrypt, decrypt, SESSION_COOKIE, SESSION_MAX_AGE, type SessionPayload } from "./session-token";

// Set COOKIE_SECURE=false only when serving production over plain http (e.g. shop LAN).
export const secureCookies = () => process.env.NODE_ENV === "production" && process.env.COOKIE_SECURE !== "false";

export const sessionCookieOptions = () => ({
  httpOnly: true,
  secure: secureCookies(),
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE,
});

export async function createSession(payload: SessionPayload) {
  const store = await cookies();
  store.set(SESSION_COOKIE, await encrypt(payload), sessionCookieOptions());
}

export async function readSession() {
  return decrypt((await cookies()).get(SESSION_COOKIE)?.value);
}

export async function deleteSession() {
  (await cookies()).delete(SESSION_COOKIE);
}
