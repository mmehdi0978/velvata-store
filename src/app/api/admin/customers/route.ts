import { NextResponse } from "next/server";
import { getDb, mapCustomer } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/customers — list registered customers (admin only)
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const db = await getDb();
  const rows = await db.prepare("SELECT * FROM customers ORDER BY id DESC").all() as Record<string, unknown>[];
  // Attach order counts per customer (by email)
  const counts = new Map<string, number>();
  try {
    const oc = await db.prepare("SELECT customer_email AS email, COUNT(*) AS c FROM orders WHERE customer_email IS NOT NULL GROUP BY customer_email").all() as { email: string; c: number }[];
    for (const r of oc) counts.set(String(r.email).toLowerCase(), r.c);
  } catch { /* orders table may predate customer_email column on old DBs */ }
  return NextResponse.json({
    customers: rows.map((r) => {
      const c = mapCustomer(r);
      return { ...c, orders: counts.get(c.email.toLowerCase()) || 0 };
    }),
  });
}
