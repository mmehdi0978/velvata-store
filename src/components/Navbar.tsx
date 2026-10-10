"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "./CartProvider";
import { useWishlist } from "./WishlistProvider";

const NAV: { href: string; label: string; hot?: boolean }[] = [
  { href: "/shop?sort=newest", label: "New Arrivals" },
  { href: "/shop?category=men", label: "Men" },
  { href: "/shop?category=women", label: "Women" },
  { href: "/shop?category=winter", label: "Winter Collection" },
  { href: "/shop?sale=1", label: "Sale", hot: true },
];

export default function Navbar({
  storeName,
  logoPath,
  announcement,
  phone,
}: {
  storeName: string;
  logoPath: string;
  announcement: string;
  phone: string;
}) {
  const { count, setDrawerOpen } = useCart();
  const { count: wishCount } = useWishlist();
  const [menuOpen, setMenuOpen] = useState(false);
  const [customerName, setCustomerName] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/customer/me")
      .then((r) => r.json())
      .then((d) => setCustomerName(d.customer?.name?.split(" ")[0] || null))
      .catch(() => {});
  }, []);

  return (
    <>
      {/* Announcement bar — thin, minimal */}
      <div className="bg-stone-950 text-white text-center text-[11px] uppercase tracking-[0.22em] px-4 py-2">
        {announcement || "Free delivery on orders above Rs 3,000 · COD available across Pakistan"}
        {phone && <span className="hidden sm:inline"> · {phone}</span>}
      </div>

      <header className="sticky top-0 z-40 bg-black">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              className="sm:hidden p-2 -ml-2 text-white"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
              </svg>
            </button>
            <Link href="/" className="flex items-center gap-2.5 text-white">
              {logoPath ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoPath} alt={storeName} className="h-9 w-9 object-contain rounded" />
              ) : (
                <span className="h-9 w-9 grid place-items-center rounded-full bg-white text-black text-lg font-bold">Q</span>
              )}
              <span className="truncate text-xl font-bold uppercase tracking-[0.22em]">{storeName}</span>
            </Link>
          </div>

          {/* Nav links — Furor style: white uppercase */}
          <nav className="hidden sm:flex items-center gap-7 text-[13px] font-medium uppercase tracking-wide text-white">
            {NAV.map((n) => (
              <Link
                key={n.label}
                href={n.href}
                className={`hover:text-stone-300 transition-colors ${n.hot ? "text-orange-500 font-semibold" : ""}`}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <Link href="/account" className="hidden sm:block px-2 text-[13px] font-medium uppercase tracking-wide text-white hover:text-stone-300">
              {customerName ? `Hi, ${customerName}` : "Login"}
            </Link>
            <Link href="/shop" aria-label="Search" className="p-2 text-white hover:text-stone-300">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" strokeLinecap="round" />
              </svg>
            </Link>
            <Link href="/wishlist" aria-label="Wishlist" className="relative p-2 text-white hover:text-stone-300">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
              {wishCount > 0 && (
                <span className="absolute top-0.5 right-0.5 h-4 min-w-4 px-1 grid place-items-center rounded-full bg-red-600 text-white text-[10px] font-bold">
                  {wishCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setDrawerOpen(true)}
              className="relative p-2 text-white hover:text-stone-300"
              aria-label="Open cart"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              {count > 0 && (
                <span className="absolute top-0.5 right-0.5 h-4 min-w-4 px-1 grid place-items-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenuOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl p-6">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold uppercase tracking-[0.22em] text-stone-950">{storeName}</span>
              <button onClick={() => setMenuOpen(false)} aria-label="Close menu" className="p-2 text-stone-500">
                ✕
              </button>
            </div>
            <nav className="mt-6 flex flex-col gap-1 text-stone-700 font-medium">
              {[{ href: "/", label: "Home" }, ...NAV, { href: "/wishlist", label: "Wishlist" }].map((n) => (
                <Link
                  key={n.label}
                  href={n.href}
                  onClick={() => setMenuOpen(false)}
                  className={`rounded-xl px-4 py-3 hover:bg-stone-100 hover:text-stone-950 ${n.hot ? "text-babli font-semibold" : ""}`}
                >
                  {n.label}
                </Link>
              ))}
            </nav>
            {phone && <p className="mt-6 text-sm text-stone-500">📞 {phone}</p>}
          </div>
        </div>
      )}
    </>
  );
}
