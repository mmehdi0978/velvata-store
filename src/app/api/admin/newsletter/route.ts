import { NextRequest, NextResponse } from "next/server";
import { getDb, mapSubscriber } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/newsletter — list subscribers (admin only)
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const rows = await (await getDb()).prepare("SELECT * FROM newsletter ORDER BY id DESC").all() as Record<string, unknown>[];
  return NextResponse.json({ subscribers: rows.map(mapSubscriber) });
}

// DELETE /api/admin/newsletter { id } — remove a subscriber (admin only)
export async function DELETE(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await req.json().catch(() => ({}));
  await (await getDb()).prepare("DELETE FROM newsletter WHERE id = ?").run(Number(id) || -1);
  return NextResponse.json({ ok: true });
}
