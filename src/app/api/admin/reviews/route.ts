import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/reviews — all reviews with product names (newest first).
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const rows = await (await getDb())
    .prepare(`SELECT r.*, p.name AS product_name, p.slug AS product_slug
      FROM reviews r LEFT JOIN products p ON p.id = r.product_id
      ORDER BY r.approved ASC, r.created_at DESC`)
    .all() as Record<string, unknown>[];
  return NextResponse.json({ reviews: rows });
}

// POST /api/admin/reviews { id, action: approve|delete }
export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id, action } = await req.json().catch(() => ({}));
  const rid = Number(id);
  if (!rid || !["approve", "delete"].includes(action)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const db = await getDb();
  if (action === "approve") {
    await db.prepare("UPDATE reviews SET approved = 1 WHERE id = ?").run(rid);
  } else {
    await db.prepare("DELETE FROM reviews WHERE id = ?").run(rid);
  }
  return NextResponse.json({ ok: true });
}
