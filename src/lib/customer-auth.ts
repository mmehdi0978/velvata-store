// Customer session helpers (cookie-based, separate from admin auth).
// Sessions are stored in SQLite in the customer_sessions table.
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getDb, mapCustomer, nowIso, type Customer } from "./db";
import { randomUUID } from "crypto";

const COOKIE_NAME = "customer_session";
const SESSION_DAYS = 30;

export async function createCustomerSession(customerId: number): Promise<string> {
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  await (await getDb()).prepare(
    "INSERT INTO customer_sessions (token, customer_id, expires_at, created_at) VALUES (?, ?, ?, ?)"
  ).run(token, customerId, expiresAt, nowIso());
  return token;
}

export async function setCustomerSessionCookie(token: string) {
  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function clearCustomerSessionCookie() {
  (await cookies()).set(COOKIE_NAME, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export async function getCustomer(): Promise<Customer | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  const db = await getDb();
  const row = await db.prepare(
    "SELECT s.expires_at AS s_expires, s.token AS s_token, c.* FROM customer_sessions s JOIN customers c ON c.id = s.customer_id WHERE s.token = ?"
  ).get(token) as Record<string, unknown> | undefined;
  if (!row) return null;
  if (new Date(row.s_expires as string) < new Date()) {
    await db.prepare("DELETE FROM customer_sessions WHERE token = ?").run(token);
    return null;
  }
  return mapCustomer(row);
}

/** Use at the top of customer API routes: returns the customer or a 401 Response. */
export async function requireCustomer() {
  const customer = await getCustomer();
  if (!customer) {
    return { customer: null as null, error: NextResponse.json({ error: "Please log in first." }, { status: 401 }) };
  }
  return { customer, error: null as null };
}

/** Absolute base URL for links inside emails. */
export function siteUrl(): string {
  return (
    process.env.SITE_URL ||
    process.env.NEXTAUTH_URL ||
    "https://velvata.pk"
  ).replace(/\/$/, "");
}
