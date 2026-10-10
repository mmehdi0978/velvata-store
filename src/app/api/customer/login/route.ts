import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { createCustomerSession, setCustomerSessionCookie } from "@/lib/customer-auth";

export const dynamic = "force-dynamic";

// POST /api/customer/login { email, password }
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    const cleanEmail = String(email || "").trim().toLowerCase();

    const row = await (await getDb()).prepare("SELECT * FROM customers WHERE email = ?").get(cleanEmail) as
      | Record<string, unknown>
      | undefined;
    if (!row) return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });

    const ok = await bcrypt.compare(String(password || ""), String(row.password_hash || ""));
    if (!ok) return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });

    if (!row.verified) {
      return NextResponse.json(
        { error: "unverified", message: "Please verify your email first — check your inbox for the link." },
        { status: 403 }
      );
    }

    const session = await createCustomerSession(Number(row.id));
    await setCustomerSessionCookie(session);
    return NextResponse.json({ ok: true, name: String(row.name || "") });
  } catch (e) {
    console.error("customer login failed", e);
    return NextResponse.json({ error: "Login failed. Please try again." }, { status: 500 });
  }
}
