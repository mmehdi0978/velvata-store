"use client";
import { useState } from "react";

export default function AdminForgotPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg("");
    try {
      const res = await fetch("/api/admin/forgot", {
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
    <div className="min-h-screen grid place-items-center bg-white px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl bg-white border border-stone-200 p-8 shadow-sm">
        <div className="text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-stone-950 text-white font-serif text-xl font-bold">
            B
          </div>
          <h1 className="mt-3 font-serif text-2xl font-bold text-stone-900 tracking-wide">VELVATA</h1>
          <p className="text-xs uppercase tracking-[0.22em] text-stone-500 mt-1">Reset Password</p>
          <p className="text-sm text-stone-500 mt-2">Enter your admin email — we&apos;ll send a reset link (valid 1 hour).</p>
        </div>
        <form onSubmit={submit} className="mt-6">
          <label className="block text-sm font-medium text-stone-700">Email
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900" />
          </label>
          {msg && <p className="mt-3 text-sm text-stone-950 bg-stone-100 border border-stone-300 rounded-xl p-3">{msg}</p>}
          <button disabled={busy} className="mt-5 w-full rounded-full bg-stone-950 text-white font-semibold py-3 hover:bg-stone-800 disabled:opacity-40 transition">
            {busy ? "Sending…" : "Send reset link"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm">
          <a href="/admin/login" className="font-medium text-stone-950 underline underline-offset-2">← Back to login</a>
        </p>
      </div>
    </div>
  );
}
