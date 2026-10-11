"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const LINKS = [
  ["Dashboard", "/admin"],
  ["Products", "/admin/products"],
  ["Orders", "/admin/orders"],
  ["Customers", "/admin/customers"],
  ["Ratings", "/admin/reviews"],
  ["Blog", "/admin/blog"],
  ["Newsletter", "/admin/newsletter"],
  ["Discounts", "/admin/discounts"],
  ["Theme", "/admin/theme"],
  ["Settings", "/admin/settings"],
];

export default function AdminSidebar({ adminName }: { adminName: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  const nav = (
    <div className="flex flex-col h-full">
      <div className="p-5">
        <div className="font-serif text-lg font-bold text-white">Admin Panel</div>
        <div className="text-xs text-stone-400 mt-0.5 truncate">{adminName}</div>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {LINKS.map(([label, href]) => (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={`block rounded-lg px-3 py-2.5 text-sm font-medium ${
              pathname === href ? "bg-stone-950 text-white" : "text-stone-300 hover:bg-stone-800"
            }`}
          >
            {label}
          </Link>
        ))}
        <Link href="/" className="block rounded-lg px-3 py-2.5 text-sm font-medium text-stone-300 hover:bg-stone-800">
          ← View Store
        </Link>
      </nav>
      <div className="p-4">
        <button onClick={logout} className="w-full rounded-lg bg-stone-800 text-stone-200 text-sm font-medium py-2.5 hover:bg-stone-700">
          Log out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 bg-stone-900 text-white px-4 py-3 flex items-center justify-between">
        <span className="font-serif font-bold">Admin Panel</span>
        <button onClick={() => setOpen(!open)} className="text-2xl leading-none" aria-label="Menu">☰</button>
      </div>
      <div className="md:hidden h-14" />
      {/* mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-stone-900">{nav}</aside>
        </div>
      )}
      {/* desktop sidebar */}
      <aside className="hidden md:block w-60 shrink-0 bg-stone-900 min-h-screen sticky top-0 h-screen">{nav}</aside>
    </>
  );
}
