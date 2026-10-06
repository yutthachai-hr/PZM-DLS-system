import { NextResponse, type NextRequest } from "next/server";
import { decrypt, SESSION_COOKIE } from "@/lib/session-token";

// Optimistic check only; every page/action re-verifies via src/lib/dal.ts.
export async function proxy(req: NextRequest) {
  const session = await decrypt(req.cookies.get(SESSION_COOKIE)?.value);
  const isLogin = req.nextUrl.pathname === "/login";
  if (!session && !isLogin) return NextResponse.redirect(new URL("/login", req.url));
  if (session && isLogin) return NextResponse.redirect(new URL("/", req.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo.svg|icon.svg).*)"],
};
