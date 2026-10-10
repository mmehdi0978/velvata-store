import { NextRequest, NextResponse } from "next/server";
import { getDb, nowIso } from "@/lib/db";
import { getJazzCashConfig } from "@/lib/jazzcash";

export const dynamic = "force-dynamic";

// DEMO ONLY — used by the local test payment screen. Refuses to run when demo mode is off.
export async function POST(req: NextRequest) {
  const cfg = await getJazzCashConfig();
  if (!cfg.demoMode) {
    return NextResponse.json({ error: "Demo mode is disabled" }, { status: 403 });
  }
  const { orderNumber, paid } = await req.json();
  const db = await getDb();
  const row = await db.prepare("SELECT id FROM orders WHERE order_number = ?").get(String(orderNumber)) as
    | { id: number }
    | undefined;
  if (!row) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  if (paid) {
    await db.prepare(
      "UPDATE orders SET payment_status = 'paid', status = 'confirmed', jazzcash_txn_ref = ?, updated_at = ? WHERE id = ?"
    ).run(`DEMO${Date.now()}`, nowIso(), row.id);
  } else {
    await db.prepare("UPDATE orders SET payment_status = 'failed', updated_at = ? WHERE id = ?").run(nowIso(), row.id);
  }
  return NextResponse.json({ ok: true });
}
