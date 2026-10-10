"use client";
import { useState } from "react";
import Link from "next/link";

const inputCls = "w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-babli";

export default function ResetPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (password !== confirm) { setErr("Passwords don't match."); return; }
    const token = new URLSearchParams(window.location.search).get("token") || "";
    if (!token) { setErr("Invalid reset link."); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/customer/reset", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }),
      });
      const d = await res.json();
      if (!res.ok) setErr(d.error || "Something went wrong.");
      else { setDone(true); setMsg("✓ " + d.message); }
    } catch {
      setErr("Something went wrong.");
    }
    setBusy(false);
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="font-serif text-2xl font-bold text-stone-900 text-center">Set a new password</h1>
      {done ? (
        <div className="mt-6 text-center">
          <p className="text-sm text-stone-950 bg-stone-100 border border-stone-300 rounded-xl p-3">{msg}</p>
          <Link href="/account" className="btn-babli inline-block mt-4 px-8 py-3">Go to my account</Link>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-3">
          <input className={inputCls} type="password" placeholder="New password (min 6 characters)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          <input className={inputCls} type="password" placeholder="Confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={6} />
          {err && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{err}</p>}
          <button type="submit" disabled={busy} className="btn-babli w-full py-3 disabled:opacity-50">{busy ? "Saving…" : "Save new password"}</button>
        </form>
      )}
    </div>
  );
}
