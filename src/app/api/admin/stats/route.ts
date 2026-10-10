import { NextResponse } from "next/server";
import { getDb, mapOrder } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Dashboard stats: totals + recent orders.
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const db = await getDb();
  const totalOrders = (await db.prepare("SELECT COUNT(*) AS c FROM orders").get() as { c: number }).c;
  const productCount = (await db.prepare("SELECT COUNT(*) AS c FROM products WHERE active = 1").get() as { c: number }).c;
  const rows = await db.prepare("SELECT * FROM orders ORDER BY created_at DESC").all() as Record<string, unknown>[];
  const orders = rows.map(mapOrder);

  const valid = orders.filter((o) => o.status !== "cancelled");
  const revenue = valid.reduce((s, o) => s + o.total, 0);
  const paidRevenue = valid.filter((o) => o.paymentStatus === "paid").reduce((s, o) => s + o.total, 0);
  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const byPaymentMethod: Record<string, number> = {};
  for (const o of valid) byPaymentMethod[o.paymentMethod] = (byPaymentMethod[o.paymentMethod] || 0) + 1;

  return NextResponse.json({
    totalOrders,
    revenue,
    paidRevenue,
    pendingOrders,
    productCount,
    byPaymentMethod,
    recentOrders: orders.slice(0, 8).map((o) => ({
      id: o.id, orderNumber: o.orderNumber, customerName: o.customerName,
      total: o.total, paymentMethod: o.paymentMethod, paymentStatus: o.paymentStatus,
      status: o.status, createdAt: o.createdAt,
    })),
  });
}
