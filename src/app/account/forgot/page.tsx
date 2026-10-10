"use client";
import { useState } from "react";
import Link from "next/link";

const inputCls = "w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-babli";

export default function ForgotPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg("");
    try {
      const res = await fetch("/api/customer/forgot", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }),
      });
      const d = await res.json();
      setMsg(res.ok ? "✓ " + d.message : d.error || "Something went wrong.");
    } catch {
      setMsg("Something went wrong.");
    }
    setBusy(false);
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="font-serif text-2xl font-bold text-stone-900 text-center">Forgot password</h1>
      <p className="mt-2 text-sm text-stone-500 text-center">Enter your account email — we&apos;ll send a reset link (valid 1 hour).</p>
      <form onSubmit={submit} className="mt-6 space-y-3">
        <input className={inputCls} type="email" placeholder="Email address *" value={email} onChange={(e) => setEmail(e.target.value)} required />
        {msg && <p className="text-sm text-stone-950 bg-stone-100 border border-stone-300 rounded-xl p-3">{msg}</p>}
        <button type="submit" disabled={busy} className="btn-babli w-full py-3 disabled:opacity-50">{busy ? "Sending…" : "Send reset link"}</button>
      </form>
      <p className="mt-4 text-center text-sm"><Link href="/account" className="text-babli-dark font-medium">← Back to login</Link></p>
    </div>
  );
}
