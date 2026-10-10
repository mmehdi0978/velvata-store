"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

function AdminResetForm() {
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setMsg("");
    if (!token) { setErr("Invalid reset link."); return; }
    if (password !== confirm) { setErr("Passwords don't match."); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/reset", {
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
    <div className="min-h-screen grid place-items-center bg-white px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl bg-white border border-stone-200 p-8 shadow-sm">
        <div className="text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-stone-950 text-white font-serif text-xl font-bold">
            B
          </div>
          <h1 className="mt-3 font-serif text-2xl font-bold text-stone-900 tracking-wide">VELVATA</h1>
          <p className="text-xs uppercase tracking-[0.22em] text-stone-500 mt-1">New Password</p>
          <p className="text-sm text-stone-500 mt-2">Choose a new password for your admin account.</p>
        </div>
        {done ? (
          <div className="mt-6">
            <p className="text-sm text-stone-950 bg-stone-100 border border-stone-300 rounded-xl p-3">{msg}</p>
            <a href="/admin/login" className="mt-5 block w-full rounded-full bg-stone-950 text-white font-semibold py-3 text-center hover:bg-stone-800 transition">
              Go to login
            </a>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6">
            <label className="block text-sm font-medium text-stone-700">New password
              <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900" />
            </label>
            <label className="block mt-3 text-sm font-medium text-stone-700">Confirm password
              <input type="password" required minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)}
                className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900" />
            </label>
            {err && <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{err}</p>}
            <button disabled={busy} className="mt-5 w-full rounded-full bg-stone-950 text-white font-semibold py-3 hover:bg-stone-800 disabled:opacity-40 transition">
              {busy ? "Updating…" : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function AdminResetPage() {
  return (
    <Suspense>
      <AdminResetForm />
    </Suspense>
  );
}
