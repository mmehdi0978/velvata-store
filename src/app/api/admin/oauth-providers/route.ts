import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/admin/oauth-providers — which social login buttons to show.
// Public: only reveals whether OAuth credentials are configured, not the values.
export async function GET() {
  return NextResponse.json({
    google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    facebook: !!(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET),
  });
}
