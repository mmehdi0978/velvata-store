import { NextRequest, NextResponse } from "next/server";
import { getAllSettings, setSetting } from "@/lib/settings";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Keys the owner is allowed to edit. Secrets stay server-side (never sent to storefront).
const EDITABLE = [
  "store_name", "store_tagline", "logo_path", "whatsapp_number",
  "cod_enabled", "jazzcash_enabled",
  "jazzcash_merchant_id", "jazzcash_password", "jazzcash_integrity_salt",
  "jazzcash_sandbox", "jazzcash_demo_mode", "jazzcash_return_url",
  "shipping_fee", "free_shipping_above",
];

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const all = await getAllSettings();
  const out: Record<string, string> = {};
  for (const k of EDITABLE) out[k] = all[k] ?? "";
  return NextResponse.json({ settings: out });
}

export async function PUT(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  try {
    const body = await req.json();
    for (const k of EDITABLE) {
      if (body[k] !== undefined) await setSetting(k, String(body[k]));
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("settings save failed", e);
    return NextResponse.json({ error: "Could not save settings" }, { status: 500 });
  }
}
