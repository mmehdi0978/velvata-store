"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.3-2.3H12v4.5h6.5c-.1 1.1-.8 2.7-2.4 3.8l-.1.1 3.5 2.7.2.1c2.2-2 3.6-5 3.6-8.9z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.8-3c-1 .7-2.4 1.2-4.2 1.2-3.2 0-6-2.2-7-5.1l-.1.1-3.7 2.9v.1C3.3 21.3 7.3 24 12 24z" />
      <path fill="#FBBC05" d="M5 14.2c-.2-.7-.4-1.4-.4-2.2s.1-1.5.4-2.2l-.1-.1-3.7-2.9-.1.1C.4 8.5 0 10.2 0 12s.4 3.5 1.1 5l3.9-2.8z" />
      <path fill="#EA4335" d="M12 4.7c1.8 0 3 .8 3.7 1.4l3.3-3.2C17.9 1.1 15.2 0 12 0 7.3 0 3.3 2.7 1.1 6.9l3.9 3.1c1-2.9 3.8-5.3 7-5.3z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#1877F2" d="M24 12a12 12 0 1 0-13.9 11.9v-8.4h-3v-3.5h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 1-2 1.9V12h3.3l-.5 3.5h-2.8v8.4A12 12 0 0 0 24 12z" />
    </svg>
  );
}

function AdminLoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [providers, setProviders] = useState({ google: false, facebook: false });

  useEffect(() => {
    const e = params.get("error");
    if (e === "AccessDenied") {
      setError("Not authorized — this Google/Facebook account is not the store owner account.");
    } else if (e) {
      setError("Social login failed. Please try again or use your password.");
    }
    fetch("/api/admin/oauth-providers")
      .then((r) => r.json())
      .then((d) => setProviders({ google: !!d.google, facebook: !!d.facebook }))
      .catch(() => {});
  }, [params]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      router.push("/admin");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
      setBusy(false);
    }
  }

  const showSocial = providers.google || providers.facebook;

  return (
    <div className="min-h-screen grid place-items-center bg-white px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl bg-white border border-stone-200 p-8 shadow-sm">
        <div className="text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-stone-950 text-white font-serif text-xl font-bold">
            B
          </div>
          <h1 className="mt-3 font-serif text-2xl font-bold text-stone-900 tracking-wide">VELVATA</h1>
          <p className="text-xs uppercase tracking-[0.22em] text-stone-500 mt-1">Admin Login</p>
          <p className="text-sm text-stone-500 mt-2">Store owner area — manage products &amp; orders.</p>
        </div>

        <form onSubmit={submit}>
          <label className="block text-sm font-medium text-stone-700">Email
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900" />
          </label>
          <label className="block mt-3 text-sm font-medium text-stone-700">Password
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900" />
          </label>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <button disabled={busy} className="mt-5 w-full rounded-full bg-stone-950 text-white font-semibold py-3 hover:bg-stone-800 disabled:opacity-40 transition">
            {busy ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm">
          <a href="/admin/forgot" className="font-medium text-stone-950 underline underline-offset-2">Forgot password?</a>
        </p>

        {showSocial && (
          <>
            <div className="my-5 flex items-center gap-3 text-xs text-stone-400">
              <span className="h-px flex-1 bg-stone-200" />
              or continue with
              <span className="h-px flex-1 bg-stone-200" />
            </div>
            <div className="grid gap-2">
              {providers.google && (
                <button
                  type="button"
                  onClick={() => signIn("google", { callbackUrl: "/api/admin/oauth-complete" })}
                  className="w-full rounded-full border border-stone-300 bg-white py-3 text-sm font-semibold text-stone-800 hover:bg-stone-50 flex items-center justify-center gap-2"
                >
                  <GoogleIcon /> Continue with Google
                </button>
              )}
              {providers.facebook && (
                <button
                  type="button"
                  onClick={() => signIn("facebook", { callbackUrl: "/api/admin/oauth-complete" })}
                  className="w-full rounded-full border border-stone-300 bg-white py-3 text-sm font-semibold text-stone-800 hover:bg-stone-50 flex items-center justify-center gap-2"
                >
                  <FacebookIcon /> Continue with Facebook
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <AdminLoginForm />
    </Suspense>
  );
}
