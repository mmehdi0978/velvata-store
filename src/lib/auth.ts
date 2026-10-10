// Admin session helpers (cookie-based). Sessions are stored in SQLite.
import { cookies } from "next/headers";
import { getDb, mapAdminUser, nowIso, type AdminUser } from "./db";
import { randomUUID } from "crypto";

const COOKIE_NAME = "admin_session";
const SESSION_DAYS = 7;

export async function createSession(adminUserId: number): Promise<string> {
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  await (await getDb()).prepare(
    "INSERT INTO sessions (token, admin_user_id, expires_at, created_at) VALUES (?, ?, ?, ?)"
  ).run(token, adminUserId, expiresAt, nowIso());
  return token;
}

export async function setSessionCookie(token: string) {
  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function clearSessionCookie() {
  (await cookies()).set(COOKIE_NAME, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export async function getAdminUser(): Promise<AdminUser | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  const db = await getDb();
  const row = await db.prepare(
    "SELECT s.*, u.email, u.password_hash, u.name AS user_name FROM sessions s JOIN admin_users u ON u.id = s.admin_user_id WHERE s.token = ?"
  ).get(token) as Record<string, unknown> | undefined;
  if (!row) return null;
  if (new Date(row.expires_at as string) < new Date()) {
    await db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
    return null;
  }
  return mapAdminUser({
    id: row.admin_user_id, email: row.email, password_hash: row.password_hash,
    name: row.user_name, created_at: row.created_at,
  });
}

/** Use at the top of admin API routes: returns the admin or a 401 Response. */
export async function requireAdmin() {
  const admin = await getAdminUser();
  if (!admin) {
    return { admin: null as null, error: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { admin, error: null as null };
}
