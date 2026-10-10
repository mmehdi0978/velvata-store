import { NextRequest, NextResponse } from "next/server";
import { getDb, nowIso } from "@/lib/db";
import { verifyJazzCashCallback } from "@/lib/jazzcash";

export const dynamic = "force-dynamic";

// JazzCash posts the payment result here (pp_ReturnURL).
// We verify pp_SecureHash, then mark the order paid/confirmed or failed.
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const body: Record<string, string> = {};
    form.forEach((v, k) => { body[k] = String(v); });

    const ok = await verifyJazzCashCallback(body);
    const orderId = parseInt(body.ppmpf_1 || "", 10);
    const txnRef = body.pp_TxnRefNo || "";
    const respCode = body.pp_ResponseCode; // "000" = success per JazzCash docs

    if (!orderId) return NextResponse.json({ error: "Unknown order" }, { status: 400 });
    const db = await getDb();
    const exists = await db.prepare("SELECT id, order_number, jazzcash_txn_ref FROM orders WHERE id = ?").get(orderId) as
      | { id: number; order_number: string; jazzcash_txn_ref: string | null }
      | undefined;
    if (!exists) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    if (!ok) {
      await db.prepare("UPDATE orders SET payment_status = 'failed', updated_at = ? WHERE id = ?").run(nowIso(), orderId);
      return NextResponse.json({ error: "Hash verification failed" }, { status: 400 });
    }

    if (respCode === "000") {
      await db.prepare(
        "UPDATE orders SET payment_status = 'paid', status = 'confirmed', jazzcash_txn_ref = ?, updated_at = ? WHERE id = ?"
      ).run(txnRef || exists.jazzcash_txn_ref, nowIso(), orderId);
    } else {
      await db.prepare("UPDATE orders SET payment_status = 'failed', updated_at = ? WHERE id = ?").run(nowIso(), orderId);
    }

    const base = process.env.NEXT_PUBLIC_BASE_URL || new URL(req.url).origin;
    return NextResponse.redirect(`${base}/checkout/success?order=${exists.order_number}`);
  } catch (e) {
    console.error("jazzcash callback failed", e);
    return NextResponse.json({ error: "Callback processing failed" }, { status: 500 });
  }
}
