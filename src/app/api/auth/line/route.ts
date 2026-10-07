import { NextResponse } from "next/server";
import { LINE_OAUTH_COOKIE, authorizeUrl, lineConfigured, type LineMode } from "@/lib/line";
import { secureCookies } from "@/lib/session";
import { signTemp } from "@/lib/session-token";

const MODES: LineMode[] = ["login", "signup", "link"];

/** Starts LINE Login: /api/auth/line?mode=login|signup|link */
export async function GET(req: Request) {
  const back = (path: string) => NextResponse.redirect(new URL(path, req.url));
  if (!lineConfigured()) return back("/login?e=line_not_configured");

  const m = new URL(req.url).searchParams.get("mode") as LineMode;
  const mode = MODES.includes(m) ? m : "login";
  const state = crypto.randomUUID();
  const nonce = crypto.randomUUID();

  const res = NextResponse.redirect(authorizeUrl(req, state, nonce));
  res.cookies.set(LINE_OAUTH_COOKIE, await signTemp("line-oauth", { state, nonce, mode }, 600), {
    httpOnly: true,
    secure: secureCookies(),
    sameSite: "lax",
    path: "/api/auth/line",
    maxAge: 600,
  });
  return res;
}
