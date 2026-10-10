import { NextRequest, NextResponse } from "next/server";
import { getDb, nowIso } from "@/lib/db";
import { siteUrl } from "@/lib/customer-auth";

export const dynamic = "force-dynamic";

// Unsubscribe via the per-subscriber token (the same verify_token issued at
// signup, kept after confirmation). GET (link click) shows a confirm page;
// POST performs the unsubscribe.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") || "";
  const base = siteUrl();
  if (!token) return NextResponse.redirect(`${base}/?newsletter=invalid-link`);
  return new NextResponse(
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Unsubscribe</title></head>` +
      `<body style="font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:80vh;background:#fafaf9;color:#1c1917">` +
      `<form method="POST" style="text-align:center;max-width:420px;padding:24px">` +
      `<h1 style="font-size:22px">Unsubscribe from newsletter?</h1>` +
      `<p style="color:#78716c">You'll stop receiving new arrivals &amp; offers emails.</p>` +
      `<input type="hidden" name="token" value="${token.replace(/"/g, "")}">` +
      `<button style="background:#1c1917;color:#fff;border:0;border-radius:999px;padding:12px 32px;font-size:15px;cursor:pointer">Yes, unsubscribe</button>` +
      `</form></body></html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}

export async function POST(req: NextRequest) {
  const base = siteUrl();
  const isJson = (req.headers.get("content-type") || "").includes("application/json");
  try {
    let token = "";
    if (isJson) {
      token = String((await req.json().catch(() => ({}))).token || "");
    } else {
      const form = await req.formData().catch(() => null);
      token = String(form?.get("token") || "");
    }
    if (!token) {
      return isJson
        ? NextResponse.json({ error: "Missing token." }, { status: 400 })
        : NextResponse.redirect(`${base}/?newsletter=invalid-link`);
    }
    const db = await getDb();
    const row = await db.prepare("SELECT id FROM newsletter WHERE verify_token = ?").get(token) as
      | { id: number }
      | undefined;
    if (!row) {
      return isJson
        ? NextResponse.json({ error: "Invalid link." }, { status: 400 })
        : NextResponse.redirect(`${base}/?newsletter=invalid-link`);
    }
    await db.prepare("UPDATE newsletter SET unsubscribed = 1, unsubscribed_at = ? WHERE id = ?").run(nowIso(), row.id);
    return isJson
      ? NextResponse.json({ ok: true, message: "You've been unsubscribed." })
      : NextResponse.redirect(`${base}/?newsletter=unsubscribed`);
  } catch (e) {
    console.error("newsletter unsubscribe failed", e);
    return isJson
      ? NextResponse.json({ error: "Something went wrong." }, { status: 500 })
      : NextResponse.redirect(`${base}/?newsletter=error`);
  }
}
