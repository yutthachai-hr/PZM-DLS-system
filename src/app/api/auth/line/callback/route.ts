import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { LINE_OAUTH_COOKIE, LINE_SIGNUP_COOKIE, exchangeCode, lineConfigured, type LineMode } from "@/lib/line";
import { secureCookies, sessionCookieOptions } from "@/lib/session";
import { SESSION_COOKIE, decrypt, encrypt, signTemp, verifyTemp } from "@/lib/session-token";

type OAuthState = { state: string; nonce: string; mode: LineMode };

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const oauth = await verifyTemp<OAuthState>("line-oauth", req.cookies.get(LINE_OAUTH_COOKIE)?.value);
  const failPath = oauth?.mode === "link" ? "/profile" : "/login";

  const go = (path: string) => {
    const res = NextResponse.redirect(new URL(path, req.url));
    res.cookies.delete({ name: LINE_OAUTH_COOKIE, path: "/api/auth/line" });
    return res;
  };

  if (!lineConfigured()) return go("/login?e=line_not_configured");
  if (sp.get("error")) return go(`${failPath}?e=line_cancel`);
  const code = sp.get("code");
  if (!oauth || !code || sp.get("state") !== oauth.state) return go(`${failPath}?e=line_failed`);

  let profile;
  try {
    profile = await exchangeCode(req, code, oauth.nonce);
  } catch (e) {
    console.error(e);
    return go(`${failPath}?e=line_failed`);
  }

  // ---- link LINE to the account that is already signed in ----
  if (oauth.mode === "link") {
    const session = await decrypt(req.cookies.get(SESSION_COOKIE)?.value);
    if (!session) return go("/login");
    const owner = await db.user.findUnique({ where: { lineUserId: profile.sub }, select: { id: true } });
    if (owner && owner.id !== session.uid) return go("/profile?e=line_taken");
    await db.user.update({ where: { id: session.uid }, data: { lineUserId: profile.sub, linePicture: profile.picture ?? null } });
    return go("/profile?s=linked");
  }

  // ---- login / signup ----
  const user = await db.user.findUnique({ where: { lineUserId: profile.sub } });
  if (user) {
    if (user.pending) return go("/login?s=pending");
    if (!user.active) return go("/login?e=disabled");
    if (profile.picture && profile.picture !== user.linePicture)
      await db.user.update({ where: { id: user.id }, data: { linePicture: profile.picture } });
    const res = go("/");
    res.cookies.set(SESSION_COOKIE, await encrypt({ uid: user.id, role: user.role, branchId: user.branchId }), sessionCookieOptions());
    return res;
  }

  // No account yet → sign-up form, carrying the verified LINE profile in a short-lived signed cookie.
  const res = go("/signup");
  res.cookies.set(LINE_SIGNUP_COOKIE, await signTemp("line-signup", profile, 900), {
    httpOnly: true,
    secure: secureCookies(),
    sameSite: "lax",
    path: "/",
    maxAge: 900,
  });
  return res;
}
