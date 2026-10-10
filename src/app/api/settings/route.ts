import { NextResponse } from "next/server";
import { getPublicSettings, getSetting } from "@/lib/settings";

// Public storefront settings (no secrets).
export async function GET() {
  const pub = await getPublicSettings();
  const [shipping_fee, free_shipping_above] = await Promise.all([
    getSetting("shipping_fee", "250"),
    getSetting("free_shipping_above", "5000"),
  ]);
  return NextResponse.json({ ...pub, shipping_fee, free_shipping_above });
}
