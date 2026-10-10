"use client";
// Neutral OAuth error page — used for both admin and customer social login
// failures (configured as `pages.error` in src/auth.ts).
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const MESSAGES: Record<string, string> = {
  AccessDenied: "This Google/Facebook account is not authorized.",
  OAuthCallback: "Social login failed. Please try again.",
  OAuthSignin: "Could not start social login. Please try again.",
  OAuthCreateAccount: "Could not create your account. Please try again.",
};

function AuthErrorInner() {
  const params = useSearchParams();
  const err = params.get("error") || "";
  const message = MESSAGES[err] || "Something went wrong with social login. Please try again.";

  return (
    <div className="min-h-screen grid place-items-center bg-white px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl bg-white border border-stone-200 p-8 shadow-sm text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-stone-950 text-white font-serif text-xl font-bold">
          B
        </div>
        <h1 className="mt-3 font-serif text-2xl font-bold text-stone-900">Login failed</h1>
        <p className="mt-2 text-sm text-stone-600">{message}</p>
        <div className="mt-6 grid gap-2">
          <Link
            href="/account"
            className="w-full rounded-full bg-stone-950 text-white font-semibold py-3 text-sm hover:bg-stone-800"
          >
            Back to My Account
          </Link>
          <Link
            href="/admin/login"
            className="w-full rounded-full border border-stone-300 text-stone-700 font-medium py-3 text-sm hover:bg-stone-50"
          >
            Admin Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense>
      <AuthErrorInner />
    </Suspense>
  );
}
