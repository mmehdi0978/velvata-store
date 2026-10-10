import { NextResponse } from "next/server";
import { getDb, mapOrder } from "@/lib/db";
import { requireCustomer } from "@/lib/customer-auth";

export const dynamic = "force-dynamic";

// GET /api/customer/orders — order history for the signed-in customer (matched by email)
export async function GET() {
  const { customer, error } = await requireCustomer();
  if (error) return error;
  try {
    const db = await getDb();
    const rows = await db
      .prepare("SELECT * FROM orders WHERE customer_id = ? OR customer_email = ? ORDER BY id DESC")
      .all(customer.id, customer.email) as Record<string, unknown>[];
    const orders = rows.map((r) => {
      const o = mapOrder(r);
      return {
        orderNumber: o.orderNumber, status: o.status, paymentStatus: o.paymentStatus,
        paymentMethod: o.paymentMethod, total: o.total, items: JSON.parse(o.items || "[]"),
        createdAt: o.createdAt,
      };
    });
    return NextResponse.json({ orders });
  } catch (e) {
    console.error("customer orders failed", e);
    return NextResponse.json({ error: "Could not load orders." }, { status: 500 });
  }
}
