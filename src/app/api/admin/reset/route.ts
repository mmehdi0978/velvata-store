import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

// POST /api/admin/reset { token, password } — single-use token, 1-hour expiry
export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();
    const pw = String(password || "");
    if (pw.length < 6) return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });

    const db = await getDb();
    const row = await db.prepare("SELECT id, reset_expires_at FROM admin_users WHERE reset_token = ?").get(String(token || "")) as
      | { id: number; reset_expires_at: string | null }
      | undefined;
    if (!row) return NextResponse.json({ error: "This reset link is invalid or already used." }, { status: 400 });
    if (!row.reset_expires_at || new Date(row.reset_expires_at) < new Date()) {
      return NextResponse.json({ error: "This reset link has expired. Please request a new one." }, { status: 400 });
    }

    const hash = await bcrypt.hash(pw, 10);
    await db.prepare("UPDATE admin_users SET password_hash = ?, reset_token = NULL, reset_expires_at = NULL WHERE id = ?").run(hash, row.id);
    // Invalidate all existing admin sessions for safety.
    await db.prepare("DELETE FROM sessions WHERE admin_user_id = ?").run(row.id);
    return NextResponse.json({ ok: true, message: "Password updated — you can now log in with your new password." });
  } catch (e) {
    console.error("admin reset failed", e);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
