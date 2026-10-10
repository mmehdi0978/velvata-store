import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { createCustomerSession, setCustomerSessionCookie } from "@/lib/customer-auth";

export const dynamic = "force-dynamic";

// POST /api/customer/reset { token, password } — single-use token, then auto-sign-in
export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();
    const pw = String(password || "");
    if (pw.length < 6) return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });

    const db = await getDb();
    const row = await db.prepare("SELECT id, reset_expires_at FROM customers WHERE reset_token = ?").get(String(token || "")) as
      | { id: number; reset_expires_at: string | null }
      | undefined;
    if (!row) return NextResponse.json({ error: "This reset link is invalid or already used." }, { status: 400 });
    if (!row.reset_expires_at || new Date(row.reset_expires_at) < new Date()) {
      return NextResponse.json({ error: "This reset link has expired. Please request a new one." }, { status: 400 });
    }

    const hash = await bcrypt.hash(pw, 10);
    await db.prepare("UPDATE customers SET password_hash = ?, reset_token = NULL, reset_expires_at = NULL WHERE id = ?").run(hash, row.id);
    // Invalidate all existing sessions for safety, then sign in fresh.
    await db.prepare("DELETE FROM customer_sessions WHERE customer_id = ?").run(row.id);
    const session = await createCustomerSession(row.id);
    await setCustomerSessionCookie(session);
    return NextResponse.json({ ok: true, message: "Password updated — you're signed in." });
  } catch (e) {
    console.error("customer reset failed", e);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
