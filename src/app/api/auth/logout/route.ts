import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/session-token";

/** Clears a session that is no longer valid (user disabled/deleted) without a redirect loop via /login. */
export async function GET(req: Request) {
  const to = new URL("/login", req.url);
  const e = new URL(req.url).searchParams.get("e");
  if (e) to.searchParams.set("e", e);
  const res = NextResponse.redirect(to);
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
