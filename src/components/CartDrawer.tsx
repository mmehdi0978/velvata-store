"use client";
import Link from "next/link";
import { useCart } from "./CartProvider";
import { formatPkr } from "@/lib/whatsapp";

export default function CartDrawer() {
  const { items, subtotal, drawerOpen, setDrawerOpen, updateQty, removeItem } = useCart();
  if (!drawerOpen) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
      <aside className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-stone-200">
          <h2 className="font-serif text-lg font-bold">Your Cart ({items.reduce((s, i) => s + i.qty, 0)})</h2>
          <button onClick={() => setDrawerOpen(false)} className="text-2xl leading-none px-2" aria-label="Close cart">×</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 && <p className="text-stone-500 text-center mt-10">Your cart is empty.</p>}
          {items.map((i) => (
            <div key={`${i.productId}-${i.size}`} className="flex gap-3 border border-stone-200 rounded-xl p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={i.image} alt={i.name} className="h-20 w-16 object-cover rounded-lg bg-stone-100" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm leading-snug">{i.name}</div>
                <div className="text-xs text-stone-500 mt-0.5">Size: {i.size}</div>
                <div className="mt-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-2 border border-stone-200 rounded-full px-1">
                    <button className="px-2 py-0.5" onClick={() => updateQty(i.productId, i.size, i.qty - 1)}>−</button>
                    <span className="text-sm w-5 text-center">{i.qty}</span>
                    <button className="px-2 py-0.5" onClick={() => updateQty(i.productId, i.size, i.qty + 1)}>+</button>
                  </div>
                  <div className="font-semibold text-sm">{formatPkr(i.price * i.qty)}</div>
                </div>
              </div>
              <button onClick={() => removeItem(i.productId, i.size)} className="self-start text-stone-400 hover:text-red-600 px-1" aria-label="Remove">×</button>
            </div>
          ))}
        </div>
        {items.length > 0 && (
          <div className="p-4 border-t border-stone-200 space-y-3">
            <div className="flex justify-between font-semibold">
              <span>Subtotal</span>
              <span>{formatPkr(subtotal)}</span>
            </div>
            <p className="text-xs text-stone-500">Shipping calculated at checkout (free above Rs 5,000).</p>
            <Link
              href="/checkout"
              onClick={() => setDrawerOpen(false)}
              className="block text-center rounded-full bg-stone-950 text-white font-semibold py-3 hover:bg-stone-950"
            >
              Checkout
            </Link>
          </div>
        )}
      </aside>
    </div>
  );
}
