import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { getDb, nowIso } from "@/lib/db";
import { createCustomerSession, setCustomerSessionCookie, siteUrl } from "@/lib/customer-auth";
import { sendVerificationEmail, sendNewCustomerAlert, isSmtpConfigured } from "@/lib/email";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/customer/signup { name, email, password }
export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();
    const cleanName = String(name || "").trim();
    const cleanEmail = String(email || "").trim().toLowerCase();
    const pw = String(password || "");

    if (cleanName.length < 2) return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
    if (!EMAIL_RE.test(cleanEmail)) return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    if (pw.length < 6) return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });

    const db = await getDb();
    const existing = await db.prepare("SELECT id, verified FROM customers WHERE email = ?").get(cleanEmail) as
      | { id: number; verified: number }
      | undefined;
    if (existing) {
      if (existing.verified) {
        return NextResponse.json({ error: "This email is already registered. Please log in." }, { status: 409 });
      }
      // Unverified account exists — resend a fresh token instead of duplicating.
      const token = randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      await db.prepare("UPDATE customers SET verify_token = ?, verify_expires_at = ?, name = ? WHERE id = ?").run(token, expires, cleanName, existing.id);
      await sendVerificationEmail(cleanEmail, cleanName, `${siteUrl()}/api/customer/verify?token=${token}`);
      return NextResponse.json({ ok: true, message: "Account already exists — we've sent a fresh verification link to your email.", emailed: isSmtpConfigured() });
    }

    const hash = await bcrypt.hash(pw, 10);
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const info = await db.prepare(
      "INSERT INTO customers (name, email, password_hash, verified, verify_token, verify_expires_at, created_at) VALUES (?, ?, ?, 0, ?, ?, ?)"
    ).run(cleanName, cleanEmail, hash, token, expires, nowIso());

    const emailed = await sendVerificationEmail(cleanEmail, cleanName, `${siteUrl()}/api/customer/verify?token=${token}`);

    // Notify the store admin about the new signup (fire-and-forget).
    sendNewCustomerAlert(cleanName, cleanEmail).catch(() => {});

    // Dev fallback: if SMTP isn't configured, auto-verify + sign in so signup never dead-ends.
    if (!isSmtpConfigured()) {
      await db.prepare("UPDATE customers SET verified = 1, verify_token = NULL, verify_expires_at = NULL WHERE id = ?").run(info.lastInsertRowid);
      const session = await createCustomerSession(Number(info.lastInsertRowid));
      await setCustomerSessionCookie(session);
      return NextResponse.json({ ok: true, autoVerified: true, message: "Account created and signed in (email not configured on server)." });
    }

    return NextResponse.json({ ok: true, emailed, message: "Account created! Check your inbox to verify your email." });
  } catch (e) {
    console.error("customer signup failed", e);
    return NextResponse.json({ error: "Signup failed. Please try again." }, { status: 500 });
  }
}
