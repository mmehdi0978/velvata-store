import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getDb } from "@/lib/db";
import { siteUrl } from "@/lib/customer-auth";
import { sendVerificationEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

// POST /api/customer/resend-verification { email }
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    const cleanEmail = String(email || "").trim().toLowerCase();
    const db = await getDb();
    const row = await db.prepare("SELECT id, name FROM customers WHERE email = ? AND verified = 0").get(cleanEmail) as
      | { id: number; name: string }
      | undefined;
    if (row) {
      const token = randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      await db.prepare("UPDATE customers SET verify_token = ?, verify_expires_at = ? WHERE id = ?").run(token, expires, row.id);
      await sendVerificationEmail(cleanEmail, row.name, `${siteUrl()}/api/customer/verify?token=${token}`);
    }
    return NextResponse.json({ ok: true, message: "If your account is still unverified, a new link has been sent." });
  } catch (e) {
    console.error("resend verification failed", e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
