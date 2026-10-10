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
    <footer className="mt-16 bg-black text-stone-300">
      <div className="max-w-7xl mx-auto px-4 py-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 text-sm">
        <div>
          <div className="text-lg font-bold uppercase tracking-[0.22em] text-white">{storeName}</div>
          <p className="mt-2 text-stone-400">{tagline || "Premium women's fashion — delivered across Pakistan."}</p>
          <div className="mt-4 flex gap-3 text-xl">
            <a href="#" aria-label="Facebook" className="hover:text-white">f</a>
            <a href="#" aria-label="Instagram" className="hover:text-white">◎</a>
            <a href="#" aria-label="TikTok" className="hover:text-white">♪</a>
            <a href="#" aria-label="YouTube" className="hover:text-white">▶</a>
          </div>
        </div>
        <div>
          <div className="font-semibold text-white mb-3 uppercase text-xs tracking-[0.18em]">Shop</div>
          <ul className="space-y-2">
            <li><a className="hover:text-white" href="/shop?sort=newest">New Arrivals</a></li>
            <li><a className="hover:text-white" href="/shop?category=men">Men</a></li>
            <li><a className="hover:text-white" href="/shop?category=women">Women</a></li>
            <li><a className="hover:text-white" href="/shop?category=winter">Winter Collection</a></li>
            <li><a className="hover:text-white" href="/shop?category=footwear">Footwear</a></li>
            <li><a className="hover:text-white" href="/shop?category=accessories">Accessories</a></li>
            <li><a className="hover:text-white text-orange-500" href="/shop?sale=1">Sale</a></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold text-white mb-3 uppercase text-xs tracking-[0.18em]">Information</div>
          <ul className="space-y-2">
            <li><a className="hover:text-white" href="/about">About Us</a></li>
            <li><a className="hover:text-white" href="/contact">Contact Us</a></li>
            <li><a className="hover:text-white" href="/faq">FAQs</a></li>
            <li><a className="hover:text-white" href="/account">My Account</a></li>
            <li><a className="hover:text-white" href="/blog">Journal</a></li>
            <li><a className="hover:text-white" href="/shipping">Shipping Policy</a></li>
            <li><a className="hover:text-white" href="/exchange-return">Exchange &amp; Return Policy</a></li>
            <li><a className="hover:text-white" href="/privacy">Privacy Policy</a></li>
            <li><a className="hover:text-white" href="/terms">Terms &amp; Conditions</a></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold text-white mb-3 uppercase text-xs tracking-[0.18em]">Stay in touch</div>
          <p className="text-stone-400">New arrivals &amp; exclusive offers, straight to your inbox.</p>
          <form onSubmit={subscribe} className="mt-3 flex gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              className="flex-1 min-w-0 rounded-full border border-stone-700 bg-stone-900 px-4 py-2 text-sm text-white placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button type="submit" disabled={busy} className="rounded-full bg-white text-black px-5 py-2 text-sm font-medium hover:bg-stone-200 disabled:opacity-50">
              {busy ? "…" : "Join"}
            </button>
          </form>
          {msg && <p className="mt-2 text-xs text-orange-400">{msg}</p>}
          <p className="mt-2 text-[11px] leading-snug text-stone-500">
            By joining you agree to receive marketing emails from {storeName}. Unsubscribe anytime.
          </p>
          <p className="mt-3 text-stone-400">Payments: COD · JazzCash · Easypaisa</p>
        </div>
      </div>
      <div className="border-t border-stone-800 py-4 text-center text-xs text-stone-500">
        {phone && (
          <p className="mb-1.5 text-stone-400">
            📞 {phone} · MON-SAT, 9:00 TO 6:00
          </p>
        )}
        © {new Date().getFullYear()} {storeName}. All rights reserved.
      </div>
    </footer>
  );
}
