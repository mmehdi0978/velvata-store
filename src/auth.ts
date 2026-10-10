// NextAuth (Auth.js v5) — Google + Facebook OAuth for ADMIN and CUSTOMER login.
//
// How authorization works:
// - The signIn callback below lets ANY verified OAuth email through. The
//   NextAuth session alone grants NOTHING.
// - /api/admin/oauth-complete re-checks that the email === ADMIN_EMAIL before
//   creating an admin session (fail closed).
// - /api/customer/oauth-complete finds-or-creates a CUSTOMER for any email.
// Never hardcode emails here; ADMIN_EMAIL comes from env.
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import type { Provider } from "next-auth/providers";

/** Normalized admin email from env (empty string = not configured). */
export function adminEmail(): string {
  return (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
}

const providers: Provider[] = [];
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}
if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
  providers.push(
    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      // Needed so the profile includes an email address to check against ADMIN_EMAIL
      authorization: { params: { scope: "email" } },
    })
  );
}

export const { handlers, auth } = NextAuth({
  // Behind cPanel's Node.js proxy — trust X-Forwarded-* headers
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  // OAuth failures go to a neutral error page (works for admin + customers)
  pages: { error: "/auth-error" },
  providers,
  callbacks: {
    async signIn({ user, profile }) {
      // Let any verified OAuth email through. Authorization happens in the
      // completion endpoints, NOT here — the NextAuth session alone grants
      // no access to anything.
      const email = String(
        user?.email || (profile as { email?: unknown } | null)?.email || ""
      )
        .trim()
        .toLowerCase();
      if (!email) {
        console.warn("OAuth login rejected: no email in profile");
        return false;
      }
      return true;
    },
  },
});
