import { NextRequest, NextResponse } from "next/server";
import { getDb, mapOrder, nowIso } from "@/lib/db";
import { buildJazzCashRequest, getJazzCashConfig } from "@/lib/jazzcash";

export const dynamic = "force-dynamic";

// POST /api/payments/jazzcash/initiate { orderId }
export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();
    const db = await getDb();
    const row = await db.prepare("SELECT * FROM orders WHERE id = ?").get(Number(orderId)) as
      | Record<string, unknown>
      | undefined;
    if (!row) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    const order = mapOrder(row);
    if (order.paymentMethod !== "jazzcash")
      return NextResponse.json({ error: "Order is not a JazzCash order" }, { status: 400 });
    if (order.paymentStatus === "paid")
      return NextResponse.json({ error: "Order already paid" }, { status: 400 });

    const cfg = await getJazzCashConfig();
    if (cfg.demoMode) {
      return NextResponse.json({ demo: true, orderNumber: order.orderNumber });
    }

    const { endpoint, params, txnRef } = await buildJazzCashRequest({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amountPkr: order.total,
      description: `Order ${order.orderNumber} — garments`,
      customerMobile: order.phone,
    });

    await db.prepare("UPDATE orders SET jazzcash_txn_ref = ?, updated_at = ? WHERE id = ?")
      .run(txnRef, nowIso(), order.id);

    return NextResponse.json({ demo: false, endpoint, params });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Payment initiation failed";
    console.error("jazzcash initiate failed", e);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
