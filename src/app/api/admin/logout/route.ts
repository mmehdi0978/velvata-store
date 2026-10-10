import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import { clearSessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const token = (await cookies()).get("admin_session")?.value;
  if (token) await (await getDb()).prepare("DELETE FROM sessions WHERE token = ?").run(token);
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
