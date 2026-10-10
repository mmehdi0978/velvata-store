import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { siteUrl } from "@/lib/customer-auth";

export const dynamic = "force-dynamic";

// GET /api/newsletter/confirm?token=... — confirm a double opt-in subscription.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") || "";
  const base = siteUrl();
  const fail = (msg: string) => NextResponse.redirect(`${base}/?newsletter=${encodeURIComponent(msg)}`);
  if (!token) return fail("invalid-link");
  try {
    const db = await getDb();
    const row = await db.prepare("SELECT id, verified, verify_expires_at, unsubscribed FROM newsletter WHERE verify_token = ?").get(token) as
      | { id: number; verified: number; verify_expires_at: string | null; unsubscribed: number }
      | undefined;
    if (!row) return fail("invalid-link");
    if (row.verified && !row.unsubscribed) return NextResponse.redirect(`${base}/?newsletter=already`);
    if (row.verify_expires_at && new Date(row.verify_expires_at) < new Date()) return fail("expired-link");
    // Keep verify_token — it doubles as the per-subscriber unsubscribe token.
    await db.prepare("UPDATE newsletter SET verified = 1, unsubscribed = 0, verify_expires_at = NULL WHERE id = ?").run(row.id);
    return NextResponse.redirect(`${base}/?newsletter=confirmed`);
  } catch (e) {
    console.error("newsletter confirm failed", e);
    return fail("error");
  }
}
