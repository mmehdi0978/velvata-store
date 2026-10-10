import { NextRequest, NextResponse } from "next/server";
import { getDb, mapOrder, type SQLValue } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/orders?status=pending&method=cod — list with filters
export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "";
  const method = searchParams.get("method") || "";
  const conds: string[] = [];
  const args: SQLValue[] = [];
  if (status) { conds.push("status = ?"); args.push(status); }
  if (method) { conds.push("payment_method = ?"); args.push(method); }
  const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";
  const rows = await (await getDb())
    .prepare(`SELECT * FROM orders ${where} ORDER BY created_at DESC LIMIT 200`)
    .all(...args) as Record<string, unknown>[];
  return NextResponse.json({
    orders: rows.map(mapOrder).map((o) => ({
      id: o.id, orderNumber: o.orderNumber, customerName: o.customerName, phone: o.phone,
      city: o.city, total: o.total, paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus, status: o.status, createdAt: o.createdAt,
    })),
  });
}
