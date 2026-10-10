import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getDb } from "@/lib/db";
import { siteUrl } from "@/lib/customer-auth";
import { sendPasswordResetEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

// POST /api/customer/forgot { email } — 1-hour reset link (always returns ok to avoid enumeration)
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    const cleanEmail = String(email || "").trim().toLowerCase();
    const db = await getDb();
    const row = await db.prepare("SELECT id, name FROM customers WHERE email = ? AND verified = 1").get(cleanEmail) as
      | { id: number; name: string }
      | undefined;
    if (row) {
      const token = randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      await db.prepare("UPDATE customers SET reset_token = ?, reset_expires_at = ? WHERE id = ?").run(token, expires, row.id);
      await sendPasswordResetEmail(cleanEmail, row.name, `${siteUrl()}/account/reset?token=${token}`);
    }
    return NextResponse.json({ ok: true, message: "If an account exists for this email, a reset link has been sent." });
  } catch (e) {
    console.error("customer forgot failed", e);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
