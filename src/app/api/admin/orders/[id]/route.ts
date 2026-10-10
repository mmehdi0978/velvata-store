import { NextRequest, NextResponse } from "next/server";
import { getDb, mapOrder, nowIso } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

const STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

// GET /api/admin/orders/[id] — full detail
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;
  const row = await (await getDb()).prepare("SELECT * FROM orders WHERE id = ?").get(Number(id)) as
    | Record<string, unknown>
    | undefined;
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const o = mapOrder(row);
  return NextResponse.json({ order: { ...o, items: JSON.parse(o.items || "[]") } });
}

// PATCH /api/admin/orders/[id] { status } — update order status
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;
  const { status } = await req.json();
  if (!STATUSES.includes(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  await (await getDb()).prepare("UPDATE orders SET status = ?, updated_at = ? WHERE id = ?").run(status, nowIso(), Number(id));
  return NextResponse.json({ order: { id: Number(id), status } });
}
