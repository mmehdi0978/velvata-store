import { NextResponse } from "next/server";
import { getDb, mapOrder } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/orders/[orderNumber] — public order lookup (for demo payment + success page).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await (await getDb()).prepare("SELECT * FROM orders WHERE order_number = ?").get(id) as
    | Record<string, unknown>
    | undefined;
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const o = mapOrder(row);
  return NextResponse.json({
    order: {
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      phone: o.phone,
      total: o.total,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      status: o.status,
    },
  });
}
