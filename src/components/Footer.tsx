"use client";
import { useState } from "react";

export default function Footer({ storeName, tagline, phone }: { storeName: string; tagline: string; phone?: string }) {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@") || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source: "footer" }),
      });
      const d = await res.json();
      setMsg(res.ok ? d.message || "✓ You're on the list!" : d.error || "Something went wrong");
      if (res.ok) setEmail("");
    } catch {
      setMsg("Something went wrong");
    }
    setBusy(false);
  }

  return (
    <footer className="mt-16 border-t border-stone-200 bg-stone-50">
      <div className="max-w-6xl mx-auto px-4 py-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 text-sm text-stone-600">
        <div>
          <div className="text-lg font-bold uppercase tracking-[0.22em] text-stone-950">{storeName}</div>
          <p className="mt-2">{tagline || "Premium women's fashion — delivered across Pakistan."}</p>
          <div className="mt-4 flex gap-3 text-xl">
            <a href="#" aria-label="Facebook" className="hover:text-stone-950">f</a>
            <a href="#" aria-label="Instagram" className="hover:text-stone-950">◎</a>
            <a href="#" aria-label="TikTok" className="hover:text-stone-950">♪</a>
            <a href="#" aria-label="YouTube" className="hover:text-stone-950">▶</a>
          </div>
        </div>
        <div>
          <div className="font-semibold text-stone-900 mb-2">Shop</div>
          <ul className="space-y-1.5">
            <li><a className="hover:text-stone-950" href="/shop?sort=newest">New Arrivals</a></li>
            <li><a className="hover:text-stone-950" href="/shop?category=unstitched">Unstitched</a></li>
            <li><a className="hover:text-stone-950" href="/shop?category=pret">Ready to Wear</a></li>
            <li><a className="hover:text-stone-950" href="/shop?category=shawls">Shawls</a></li>
            <li><a className="hover:text-stone-950" href="/shop?sale=1">Sale</a></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold text-stone-900 mb-2">Information</div>
          <ul className="space-y-1.5">
            <li><a className="hover:text-stone-950" href="/account">My Account</a></li>
            <li><a className="hover:text-stone-950" href="/blog">Journal</a></li>
            <li><a className="hover:text-stone-950" href="/shipping">Shipping Policy</a></li>
            <li><a className="hover:text-stone-950" href="/exchange-return">Exchange &amp; Return Policy</a></li>
            <li><a className="hover:text-stone-950" href="/privacy">Privacy Policy</a></li>
            <li><a className="hover:text-stone-950" href="/terms">Terms &amp; Conditions</a></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold text-stone-900 mb-2">Stay in touch</div>
          <p className="text-stone-500">New arrivals &amp; exclusive offers, straight to your inbox.</p>
          <form onSubmit={subscribe} className="mt-3 flex gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              className="flex-1 min-w-0 rounded-full border border-stone-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-babli"
            />
            <button type="submit" disabled={busy} className="rounded-full bg-stone-950 text-white px-5 py-2 text-sm font-medium hover:bg-stone-800 disabled:opacity-50">
              {busy ? "…" : "Join"}
            </button>
          </form>
          {msg && <p className="mt-2 text-xs text-babli-dark">{msg}</p>}
          <p className="mt-2 text-[11px] leading-snug text-stone-400">
            By joining you agree to receive marketing emails from {storeName}. Unsubscribe anytime.
          </p>
          <p className="mt-3 text-stone-500">Payments: COD · JazzCash · Easypaisa</p>
        </div>
      </div>
      <div className="border-t border-stone-200 py-4 text-center text-xs text-stone-400">
        {phone && (
          <p className="mb-1.5 text-stone-500">
            📞 {phone} · MON-SAT, 9:00 TO 6:00
          </p>
        )}
        © {new Date().getFullYear()} {storeName}. All rights reserved.
      </div>
    </footer>
  );
}
