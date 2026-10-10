import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCustomer } from "@/lib/customer-auth";

export const dynamic = "force-dynamic";

// GET /api/customer/me — current signed-in customer (or null)
export async function GET() {
  const customer = await getCustomer();
  if (!customer) return NextResponse.json({ customer: null });
  return NextResponse.json({ customer });
}

// POST /api/customer/logout
export async function POST() {
  try {
    const { cookies } = await import("next/headers");
    const token = (await cookies()).get("customer_session")?.value;
    if (token) {
      await (await getDb()).prepare("DELETE FROM customer_sessions WHERE token = ?").run(token);
    }
    const { clearCustomerSessionCookie } = await import("@/lib/customer-auth");
    await clearCustomerSessionCookie();
  } catch (e) {
    console.error("customer logout failed", e);
  }
  return NextResponse.json({ ok: true });
}
