import { NextRequest, NextResponse } from "next/server";
import { auth, adminEmail } from "@/auth";
import { getDb, mapAdminUser } from "@/lib/db";
import { createSession, setSessionCookie } from "@/lib/auth";
import { sendLoginAlert } from "@/lib/email";

export const dynamic = "force-dynamic";

// GET /api/admin/oauth-complete
// NextAuth redirects here (as callbackUrl) after a successful Google/Facebook
// sign-in. This creates the SAME `admin_session` cookie the password login
// creates, so the existing admin auth guard works unchanged.
export async function GET(req: NextRequest) {
  // Behind cPanel's proxy, req.nextUrl.origin is localhost — use AUTH_URL instead
  const base = process.env.AUTH_URL || process.env.NEXTAUTH_URL || req.nextUrl.origin;
  const denied = (reason: string) =>
    NextResponse.redirect(new URL(`/admin/login?error=${reason}`, base));

  try {
    const session = await auth();
    const email = String(session?.user?.email || "").trim().toLowerCase();
    const expected = adminEmail();
    // Belt & braces: re-check the email here even though the NextAuth
    // signIn callback already gated it.
    if (!email || !expected || email !== expected) return denied("AccessDenied");

    const row = await (await getDb())
      .prepare("SELECT * FROM admin_users WHERE email = ?")
      .get(email) as Record<string, unknown> | undefined;
    if (!row) return denied("AccessDenied");

    const admin = mapAdminUser(row);
    const token = await createSession(admin.id);
    await setSessionCookie(token);

    // Admin login email alert — fire-and-forget, never blocks login
    void sendLoginAlert({
      email: admin.email,
      name: admin.name,
      ip:
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("x-real-ip") ||
        "unknown",
      userAgent: req.headers.get("user-agent") || "unknown",
      time: new Date().toISOString(),
    });

    return NextResponse.redirect(new URL("/admin", base));
  } catch (e) {
    console.error("oauth-complete failed", e);
    return denied("OAuthCallback");
  }
}
