import "server-only";

/**
 * LINE Login v2.1 (OpenID Connect).
 * Setup: LINE Developers → Provider → Create a LINE Login channel → copy Channel ID / secret
 * → Callback URL = <APP_URL>/api/auth/line/callback
 */
export const LINE_OAUTH_COOKIE = "pm_line_oauth";
export const LINE_SIGNUP_COOKIE = "pm_line_signup";

export type LineMode = "login" | "signup" | "link";
export type LineProfile = { sub: string; name: string; picture?: string };

export function lineConfigured() {
  return Boolean(process.env.LINE_CHANNEL_ID && process.env.LINE_CHANNEL_SECRET);
}

export function appOrigin(req: Request) {
  return (process.env.APP_URL || new URL(req.url).origin).replace(/\/$/, "");
}

export const callbackUrl = (req: Request) => `${appOrigin(req)}/api/auth/line/callback`;

export function authorizeUrl(req: Request, state: string, nonce: string) {
  const u = new URL("https://access.line.me/oauth2/v2.1/authorize");
  u.search = new URLSearchParams({
    response_type: "code",
    client_id: process.env.LINE_CHANNEL_ID!,
    redirect_uri: callbackUrl(req),
    state,
    scope: "profile openid",
    nonce,
  }).toString();
  return u.toString();
}

/** Exchanges the code and verifies the ID token with LINE; returns the user's LINE profile. */
export async function exchangeCode(req: Request, code: string, nonce: string): Promise<LineProfile> {
  const tokenRes = await fetch("https://api.line.me/oauth2/v2.1/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: callbackUrl(req),
      client_id: process.env.LINE_CHANNEL_ID!,
      client_secret: process.env.LINE_CHANNEL_SECRET!,
    }),
    cache: "no-store",
  });
  if (!tokenRes.ok) throw new Error(`LINE token exchange failed (${tokenRes.status})`);
  const { id_token } = (await tokenRes.json()) as { id_token?: string };
  if (!id_token) throw new Error("LINE returned no id_token");

  const verifyRes = await fetch("https://api.line.me/oauth2/v2.1/verify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ id_token, client_id: process.env.LINE_CHANNEL_ID!, nonce }),
    cache: "no-store",
  });
  if (!verifyRes.ok) throw new Error(`LINE id_token verify failed (${verifyRes.status})`);
  const claims = (await verifyRes.json()) as { sub?: string; name?: string; picture?: string };
  if (!claims.sub) throw new Error("LINE id_token has no subject");
  return { sub: claims.sub, name: claims.name ?? "", picture: claims.picture };
}
