import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb, nowIso } from "@/lib/db";
import { createCustomerSession, setCustomerSessionCookie } from "@/lib/customer-auth";
import { sendNewCustomerAlert } from "@/lib/email";

export const dynamic = "force-dynamic";

// GET /api/customer/oauth-complete
// NextAuth redirects here (as callbackUrl) after a successful Google/Facebook
// sign-in from the customer /account page. Finds the customer by email or
// creates a new verified customer, then sets the SAME `customer_session`
// cookie the password login creates.
export async function GET(req: NextRequest) {
  // Behind cPanel's proxy, req.nextUrl.origin is localhost — use AUTH_URL instead
  const base = process.env.AUTH_URL || process.env.NEXTAUTH_URL || req.nextUrl.origin;
  const denied = (reason: string) =>
    NextResponse.redirect(new URL(`/account?error=${reason}`, base));

  try {
    const session = await auth();
    const email = String(session?.user?.email || "").trim().toLowerCase();
    const name =
      String(session?.user?.name || "").trim().slice(0, 60) ||
      email.split("@")[0] ||
      "Customer";
    if (!email) return denied("noemail");

    const db = await getDb();
    const row = await db
      .prepare("SELECT * FROM customers WHERE email = ?")
      .get(email) as Record<string, unknown> | undefined;

    let customerId: number;
    let customerName = name;
    if (row) {
      customerId = row.id as number;
      customerName = String(row.name || name);
      // OAuth email is verified — upgrade a password-signup account if needed.
      if (!row.verified) {
        await db.prepare("UPDATE customers SET verified = 1 WHERE id = ?").run(customerId);
      }
    } else {
      // New customer via social login: verified, no password (they can set one
      // later via "Forgot password?" if they want password login too).
      const res = await db
        .prepare(
          "INSERT INTO customers (name, email, password_hash, verified, created_at) VALUES (?, ?, ?, 1, ?)"
        )
        .run(name, email, "", nowIso());
      customerId = Number(res.lastInsertRowid);
      // Admin alert — fire-and-forget, never blocks login
      void sendNewCustomerAlert(name, email).catch(() => {});
    }

    const token = await createCustomerSession(customerId);
    await setCustomerSessionCookie(token);
    return NextResponse.redirect(
      new URL(`/account?oauth=success&name=${encodeURIComponent(customerName)}`, base)
    );
  } catch (e) {
    console.error("customer oauth-complete failed", e);
    return denied("failed");
  }
}
