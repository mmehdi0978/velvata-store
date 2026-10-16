import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Exposes the current pathname to server components via the x-pathname
// request header, so the root layout can render a per-path canonical
// <link> in the raw HTML (crawlers that don't execute JS still see it).
// No redirects, rewrites, or response changes — pass-through only.
export function middleware(req: NextRequest) {
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", req.nextUrl.pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}
