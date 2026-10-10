import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { createCustomerSession, setCustomerSessionCookie, siteUrl } from "@/lib/customer-auth";

export const dynamic = "force-dynamic";

// GET /api/customer/verify?token=... — verify email, auto-sign-in, redirect to /account
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") || "";
  const base = siteUrl();
  const fail = (msg: string) => NextResponse.redirect(`${base}/account?verify=error&msg=${encodeURIComponent(msg)}`);
  if (!token) return fail("Missing verification link.");

  try {
    const db = await getDb();
    const row = await db.prepare("SELECT id, verified, verify_expires_at FROM customers WHERE verify_token = ?").get(token) as
      | { id: number; verified: number; verify_expires_at: string | null }
      | undefined;
    if (!row) return fail("This verification link is invalid or already used.");
    if (row.verified) {
      const session = await createCustomerSession(row.id);
      await setCustomerSessionCookie(session);
      return NextResponse.redirect(`${base}/account?verify=already`);
    }
    if (!row.verify_expires_at || new Date(row.verify_expires_at) < new Date()) {
      return fail("This verification link has expired. Please request a new one from the login page.");
    }
    await db.prepare("UPDATE customers SET verified = 1, verify_token = NULL, verify_expires_at = NULL WHERE id = ?").run(row.id);
    const session = await createCustomerSession(row.id);
    await setCustomerSessionCookie(session);
    return NextResponse.redirect(`${base}/account?verify=success`);
  } catch (e) {
    console.error("customer verify failed", e);
    return fail("Something went wrong. Please try again.");
  }
}
