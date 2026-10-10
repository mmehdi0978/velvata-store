import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// POST /api/discounts/validate { code, subtotal } — validate a discount code.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const code = String(body.code || "").trim().toUpperCase();
  const subtotal = Number(body.subtotal) || 0;
  if (!code) return NextResponse.json({ error: "Enter a discount code." }, { status: 400 });

  const row = await (await getDb())
    .prepare("SELECT code, kind, value, min_order, active FROM discount_codes WHERE code = ?")
    .get(code) as Record<string, unknown> | undefined;
  if (!row || !row.active) return NextResponse.json({ error: "Invalid discount code." }, { status: 404 });
  if (subtotal < Number(row.min_order)) {
    return NextResponse.json(
      { error: `This code needs a minimum order of Rs ${Number(row.min_order).toLocaleString()}.` },
      { status: 400 }
    );
  }
  const value = Number(row.value);
  const amount = row.kind === "percent" ? Math.round((subtotal * value) / 100) : Math.min(value, subtotal);
  return NextResponse.json({
    ok: true,
    code: row.code,
    kind: row.kind,
    value,
    amount,
    label: row.kind === "percent" ? `${value}% off` : `Rs ${value.toLocaleString()} off`,
  });
}
