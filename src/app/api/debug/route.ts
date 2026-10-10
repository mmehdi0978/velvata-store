import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

/**
 * Temporary diagnostic endpoint — reports the database status on the host.
 * Delete this file before going live. Visit: https://<domain>/api/debug
 */
export async function GET() {
  const report: Record<string, unknown> = {
    nodeVersion: process.version,
    cwd: process.cwd(),
    appRoot: process.env.APP_ROOT ?? "(not set)",
    databaseUrl: process.env.DATABASE_URL ?? "(default file:./dev.db)",
    engine: "sql.js (WASM, pure JS)",
  };
  try {
    const db = await getDb();
    const row = await db.prepare("SELECT COUNT(*) AS c FROM products").get() as
      | { c: number }
      | undefined;
    report.status = "ok";
    report.products = row?.c;
  } catch (e: any) {
    report.status = "FAIL: " + (e?.message ?? String(e));
  }
  return NextResponse.json(report);
}
