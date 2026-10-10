import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/discounts — all codes.
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const rows = await (await getDb()).prepare("SELECT * FROM discount_codes ORDER BY created_at DESC").all();
  return NextResponse.json({ codes: rows });
}

// POST /api/admin/discounts { code, kind, value, min_order } — create.
export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  const b = await req.json().catch(() => ({}));
  const code = String(b.code || "").trim().toUpperCase();
  if (!code) return NextResponse.json({ error: "Code is required" }, { status: 400 });
  const value = parseInt(b.value, 10);
  if (!value || value <= 0) return NextResponse.json({ error: "Value must be positive" }, { status: 400 });
  const kind = b.kind === "fixed" ? "fixed" : "percent";
  if (kind === "percent" && value > 90) return NextResponse.json({ error: "Percent cannot exceed 90" }, { status: 400 });
  try {
    await (await getDb())
      .prepare("INSERT INTO discount_codes (code, kind, value, min_order, active) VALUES (?, ?, ?, ?, 1)")
      .run(code, kind, value, parseInt(b.min_order, 10) || 0);
  } catch {
    return NextResponse.json({ error: "Code already exists" }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}

// PUT /api/admin/discounts { id, active } — toggle.
export async function PUT(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id, active } = await req.json().catch(() => ({}));
  if (!Number(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  await (await getDb()).prepare("UPDATE discount_codes SET active = ? WHERE id = ?").run(active ? 1 : 0, Number(id));
  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/discounts?id= — remove.
export async function DELETE(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  const id = new URL(req.url).searchParams.get("id");
  await (await getDb()).prepare("DELETE FROM discount_codes WHERE id = ?").run(Number(id));
  return NextResponse.json({ ok: true });
}
