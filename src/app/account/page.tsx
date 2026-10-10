"use client";
// Customer account: login / signup tabs, or profile + order history when signed in.
import { useEffect, useState } from "react";
import Link from "next/link";
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

interface Customer { id: number; name: string; email: string; verified: boolean; createdAt: string }
interface OrderItem { name: string; size: string; qty: number; price: number }
interface Order { orderNumber: string; status: string; paymentStatus: string; paymentMethod: string; total: number; items: OrderItem[]; createdAt: string }

const inputCls = "w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-babli";

export default function AccountPage() {
  const [customer, setCustomer] = useState<Customer | null | undefined>(undefined);
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notice, setNotice] = useState("");
  const [providers, setProviders] = useState({ google: false, facebook: false });

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const v = q.get("verify");
    if (v === "success") setNotice("✓ Email verified — welcome!");
    else if (v === "already") setNotice("Your email was already verified — you're signed in.");
    else if (v === "error") setNotice("⚠ " + (q.get("msg") || "Verification failed."));
    if (q.get("oauth") === "success") {
      const n = q.get("name");
      setNotice(`✓ Welcome${n ? `, ${n}` : ""}! You're signed in.`);
    }
    const e = q.get("error");
    if (e === "noemail") setErr("Could not get your email from Google/Facebook. Please try again.");
    else if (e === "failed") setErr("Social login failed. Please try again or use your password.");
    fetch("/api/admin/oauth-providers")
      .then((r) => r.json())
      .then((d) => setProviders({ google: !!d.google, facebook: !!d.facebook }))
      .catch(() => {});
    fetch("/api/customer/me").then((r) => r.json()).then((d) => setCustomer(d.customer)).catch(() => setCustomer(null));
  }, []);

  useEffect(() => {
    if (customer) {
      fetch("/api/customer/orders").then((r) => r.json()).then((d) => setOrders(d.orders || [])).catch(() => {});
    }
  }, [customer]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setMsg(""); setBusy(true);
    try {
      const res = await fetch(`/api/customer/${tab}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const d = await res.json();
      if (!res.ok) {
        if (d.error === "unverified") {
          setErr(d.message + " ");
          setMsg("resend");
        } else {
          setErr(d.error || "Something went wrong.");
        }
      } else {
        if (tab === "signup") {
          setMsg(d.autoVerified ? "✓ Account created — you're signed in!" : "✓ " + (d.message || "Check your inbox to verify your email."));
          if (d.autoVerified) {
            const me = await fetch("/api/customer/me").then((r) => r.json());
            setCustomer(me.customer);
          }
        } else {
          const me = await fetch("/api/customer/me").then((r) => r.json());
          setCustomer(me.customer);
        }
      }
    } catch {
      setErr("Something went wrong. Please try again.");
    }
    setBusy(false);
  }

  async function resend() {
    setErr(""); setMsg("");
    const res = await fetch("/api/customer/resend-verification", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }),
    });
    const d = await res.json();
    setMsg(res.ok ? "✓ " + d.message : d.error || "Failed.");
  }

  async function logout() {
    await fetch("/api/customer/me", { method: "POST" });
    setCustomer(null); setOrders([]);
  }

  if (customer === undefined) {
    return <div className="max-w-md mx-auto px-4 py-16 text-center text-stone-500">Loading…</div>;
  }

  if (customer) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        {notice && <p className="mb-4 rounded-xl bg-stone-100 border border-stone-300 text-stone-950 text-sm p-3">{notice}</p>}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-serif text-2xl font-bold text-stone-900">Hi, {customer.name} 👋</h1>
            <p className="text-sm text-stone-500">{customer.email}</p>
          </div>
          <button onClick={logout} className="rounded-full border border-stone-300 px-5 py-2 text-sm hover:bg-stone-100">Log out</button>
        </div>
        <h2 className="mt-8 font-semibold text-stone-900">Order history</h2>
        {orders.length === 0 ? (
          <p className="mt-3 text-sm text-stone-500">No orders yet. <Link href="/shop" className="text-babli-dark font-medium">Start shopping →</Link></p>
        ) : (
          <div className="mt-4 space-y-3">
            {orders.map((o) => (
              <div key={o.orderNumber} className="rounded-2xl border border-stone-200 bg-white p-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="font-semibold text-sm">{o.orderNumber}</div>
                  <div className="flex gap-2 text-xs">
                    <span className="rounded-full bg-stone-100 px-2.5 py-1 capitalize">{o.status}</span>
                    <span className="rounded-full bg-stone-100 px-2.5 py-1 capitalize">{o.paymentMethod}</span>
                  </div>
                </div>
                <div className="mt-2 text-sm text-stone-600">
                  {o.items.map((i) => `${i.name} (${i.size}) × ${i.qty}`).join(", ")}
                </div>
                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-stone-500">{new Date(o.createdAt).toLocaleDateString()}</span>
                  <span className="font-bold text-babli-dark">Rs {o.total.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="font-serif text-2xl font-bold text-stone-900 text-center">My Account</h1>
      {notice && <p className="mt-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm p-3">{notice}</p>}
      <div className="mt-6 grid grid-cols-2 rounded-full bg-stone-100 p-1 text-sm font-medium">
        {(["login", "signup"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setErr(""); setMsg(""); }}
            className={`rounded-full py-2 capitalize ${tab === t ? "bg-white shadow text-stone-950" : "text-stone-500"}`}
          >
            {t === "login" ? "Log in" : "Sign up"}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="mt-6 space-y-3">
        {tab === "signup" && (
          <input className={inputCls} placeholder="Full name *" value={name} onChange={(e) => setName(e.target.value)} required />
        )}
        <input className={inputCls} type="email" placeholder="Email address *" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className={inputCls} type="password" placeholder={`Password *${tab === "signup" ? " (min 6 characters)" : ""}`} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        {err && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
            {err}
            {msg === "resend" && <button type="button" onClick={resend} className="underline font-medium ml-1">Resend link</button>}
          </p>
        )}
        {msg && msg !== "resend" && <p className="text-sm text-stone-950 bg-stone-100 border border-stone-300 rounded-xl p-3">{msg}</p>}
        <button type="submit" disabled={busy} className="btn-babli w-full py-3 disabled:opacity-50">
          {busy ? "Please wait…" : tab === "login" ? "Log in" : "Create account"}
        </button>
      </form>
      {tab === "login" && (
        <p className="mt-4 text-center text-sm">
          <Link href="/account/forgot" className="text-babli-dark font-medium">Forgot password?</Link>
        </p>
      )}
      {(providers.google || providers.facebook) && (
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
                onClick={() => signIn("google", { callbackUrl: "/api/customer/oauth-complete" })}
                className="flex items-center justify-center gap-2.5 rounded-full border border-stone-300 bg-white py-3 text-sm font-medium text-stone-700 hover:bg-stone-50"
              >
                <GoogleIcon /> Continue with Google
              </button>
            )}
            {providers.facebook && (
              <button
                type="button"
                onClick={() => signIn("facebook", { callbackUrl: "/api/customer/oauth-complete" })}
                className="flex items-center justify-center gap-2.5 rounded-full border border-stone-300 bg-white py-3 text-sm font-medium text-stone-700 hover:bg-stone-50"
              >
                <FacebookIcon /> Continue with Facebook
              </button>
            )}
          </div>
        </>
      )}
      <p className="mt-6 text-center text-xs text-stone-400">Guest checkout is always available — no account needed to order.</p>
    </div>
  );
}
