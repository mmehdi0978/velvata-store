import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// GET /api/orders/track?orderNumber=BAB-1234 — public order status lookup.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderNumber = (searchParams.get("orderNumber") || "").trim().toUpperCase();
  if (!orderNumber) return NextResponse.json({ error: "Order number required." }, { status: 400 });
  const row = await (await getDb())
    .prepare("SELECT order_number, status, payment_method, payment_status, total, created_at FROM orders WHERE order_number = ?")
    .get(orderNumber) as Record<string, unknown> | undefined;
  if (!row) return NextResponse.json({ error: "Order not found. Please check the order number." }, { status: 404 });
  return NextResponse.json({
    order: {
      orderNumber: row.order_number,
      status: row.status,
      paymentMethod: row.payment_method,
      paymentStatus: row.payment_status,
      total: row.total,
      createdAt: row.created_at,
    },
  });
}
