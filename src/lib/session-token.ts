import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@prisma/client";

export type SessionPayload = { uid: string; role: Role; branchId: string | null };

export const SESSION_COOKIE = "pm_session";
export const SESSION_MAX_AGE = 60 * 60 * 12; // one shift + margin

function key() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(key());
}

export async function decrypt(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/** Short-lived signed payloads (OAuth state, pending sign-up profile). `typ` keeps them from being swapped. */
export async function signTemp<T extends Record<string, unknown>>(typ: string, payload: T, seconds: number) {
  return new SignJWT({ ...payload, typ })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${seconds}s`)
    .sign(key());
}

export async function verifyTemp<T>(typ: string, token: string | undefined): Promise<T | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    return payload.typ === typ ? (payload as T) : null;
  } catch {
    return null;
  }
}
