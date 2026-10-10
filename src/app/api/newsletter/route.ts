import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getDb, nowIso } from "@/lib/db";
import { siteUrl } from "@/lib/customer-auth";
import { sendNewsletterConfirmEmail, isSmtpConfigured } from "@/lib/email";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/newsletter { email, source? } — double opt-in: creates a pending
// subscription and emails a confirmation link.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    const source = String(body.source || "footer").slice(0, 32);
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    const db = await getDb();
    const existing = await db.prepare("SELECT id, verified, unsubscribed FROM newsletter WHERE email = ?").get(email) as
      | { id: number; verified: number; unsubscribed: number }
      | undefined;

    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
    const link = `${siteUrl()}/api/newsletter/confirm?token=${token}`;

    if (existing) {
      if (existing.verified && !existing.unsubscribed) {
        return NextResponse.json({ error: "This email is already subscribed." }, { status: 409 });
      }
      // Re-subscribe (was pending or unsubscribed): fresh token.
      await db.prepare(
        "UPDATE newsletter SET verified = 0, unsubscribed = 0, unsubscribed_at = NULL, verify_token = ?, verify_expires_at = ?, source = ? WHERE id = ?"
      ).run(token, expires, source, existing.id);
    } else {
      await db.prepare(
        "INSERT INTO newsletter (email, source, verified, verify_token, verify_expires_at, created_at) VALUES (?, ?, 0, ?, ?, ?)"
      ).run(email, source, token, expires, nowIso());
    }

    // Dev fallback: no SMTP → auto-confirm so the flow never dead-ends.
    // (verify_token is kept — it doubles as the unsubscribe token.)
    if (!isSmtpConfigured()) {
      await db.prepare("UPDATE newsletter SET verified = 1, verify_expires_at = NULL WHERE email = ?").run(email);
      return NextResponse.json({ ok: true, autoConfirmed: true, message: "✓ You're on the list!" });
    }

    await sendNewsletterConfirmEmail(email, link);
    return NextResponse.json({ ok: true, message: "Almost done! Check your inbox to confirm your subscription." });
  } catch (e) {
    console.error("newsletter subscribe failed", e);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
