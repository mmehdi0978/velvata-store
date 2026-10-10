"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "./CartProvider";
import { useWishlist } from "./WishlistProvider";

const NAV: { href: string; label: string; hot?: boolean; isNew?: boolean; dropdown?: { href: string; label: string }[] }[] = [
  { href: "/shop?sale=1", label: "Final Call - Season End Sale", hot: true },
  { href: "/shop?sort=newest", label: "New Arrivals", isNew: true },
  {
    href: "/shop?category=men", label: "Men",
    dropdown: [
      { href: "/shop?category=men", label: "All Men" },
      { href: "/shop?category=men&search=kurta", label: "Kurtas" },
      { href: "/shop?category=men&search=shalwar", label: "Shalwar Kameez" },
      { href: "/shop?category=men&search=shirt", label: "Shirts" },
      { href: "/shop?category=men&search=jeans", label: "Jeans" },
      { href: "/shop?category=men&search=polo", label: "Polos" },
    ],
  },
  {
    href: "/shop?category=winter", label: "Winter Collection",
    dropdown: [
      { href: "/shop?category=winter", label: "All Winter" },
      { href: "/shop?category=winter&search=shawl", label: "Shawls" },
      { href: "/shop?category=winter&search=pashmina", label: "Pashmina" },
      { href: "/shop?category=winter&search=wool", label: "Wool Wraps" },
    ],
  },
  {
    href: "/shop?category=women", label: "Women",
    dropdown: [
      { href: "/shop?category=women", label: "All Women" },
      { href: "/shop?category=women&search=lawn", label: "Lawn Suits" },
      { href: "/shop?category=women&search=chiffon", label: "Chiffon" },
      { href: "/shop?category=women&search=khaddar", label: "Khaddar" },
      { href: "/shop?category=women&search=kurti", label: "Kurtis" },
    ],
  },
  {
    href: "/shop?category=footwear", label: "Footwear",
    dropdown: [
      { href: "/shop?category=footwear", label: "All Footwear" },
    ],
  },
  {
    href: "/shop?category=accessories", label: "Accessories",
    dropdown: [
      { href: "/shop?category=accessories", label: "All Accessories" },
      { href: "/shop?category=accessories&search=bag", label: "Bags" },
      { href: "/shop?category=accessories&search=earring", label: "Jewelry" },
      { href: "/shop?category=accessories&search=scarf", label: "Scarves" },
    ],
  },
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
      {/* Announcement bar — scrolling marquee (Furor style) */}
      <div className="bg-stone-950 text-white text-[11px] uppercase tracking-[0.18em] overflow-hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 px-4">
          <div className="flex-1 overflow-hidden py-2">
            <div className="flex whitespace-nowrap animate-[marquee_22s_linear_infinite] gap-12 w-max">
              {[0, 1].map((n) => (
                <span key={n} className="flex gap-12">
                  <span>📦 Free delivery on orders above Rs 3,000</span>
                  <span>🔥 Final Call — Season End Sale, up to 60% off</span>
                  <span>💵 Cash on Delivery available across Pakistan</span>
                  {phone && <span>📞 {phone} · MON-SAT, 9:00 TO 6:00</span>}
                </span>
              ))}
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4 shrink-0 py-2">
            <Link href="/about" className="hover:text-stone-300">About Us</Link>
            <Link href="/contact" className="hover:text-stone-300">Contact Us</Link>
            <Link href="/faq" className="hover:text-stone-300">FAQs</Link>
            <Link href="/shipping" className="hover:text-stone-300">Shipping</Link>
            <Link href="/exchange-return" className="hover:text-stone-300">Returns</Link>
          </div>
        </div>
      </div>
      <style>{`@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>

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

          {/* Nav links — Furor style: white uppercase with dropdowns */}
          <nav className="hidden sm:flex items-center gap-7 text-[13px] font-medium uppercase tracking-wide text-white">
            {NAV.map((n) => (
              <div key={n.label} className="relative group/nav">
                <Link
                  href={n.href}
                  className={`relative flex items-center gap-1 hover:text-stone-300 transition-colors py-5 ${n.hot ? "text-orange-500 font-semibold" : ""}`}
                >
                  {n.isNew && (
                    <span className="absolute -top-1 left-1/2 -translate-x-1/2 text-[9px] font-bold text-orange-500 uppercase tracking-wider">New</span>
                  )}
                  {n.label}
                  {n.dropdown && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m6 9 6 6 6-6" strokeLinecap="round" />
                    </svg>
                  )}
                </Link>
                {n.dropdown && (
                  <div className="absolute top-full left-0 min-w-48 bg-white shadow-xl rounded-b-lg py-2 opacity-0 invisible group-hover/nav:opacity-100 group-hover/nav:visible transition-all duration-200 z-50">
                    {n.dropdown.map((d) => (
                      <Link
                        key={d.label}
                        href={d.href}
                        className="block px-5 py-2.5 text-[13px] normal-case tracking-normal text-stone-700 hover:bg-stone-100 hover:text-stone-950 font-normal"
                      >
                        {d.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
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
