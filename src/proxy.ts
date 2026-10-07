import { NextResponse, type NextRequest } from "next/server";
import { decrypt, SESSION_COOKIE } from "@/lib/session-token";

const PUBLIC = ["/login", "/signup"];

// Optimistic check only; every page/action re-verifies via src/lib/dal.ts.
export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  if (path.startsWith("/api/auth/")) return NextResponse.next();
  const session = await decrypt(req.cookies.get(SESSION_COOKIE)?.value);
  const isPublic = PUBLIC.includes(path);
  if (!session && !isPublic) return NextResponse.redirect(new URL("/login", req.url));
  if (session && isPublic) return NextResponse.redirect(new URL("/", req.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo.svg|icon.svg).*)"],
};
