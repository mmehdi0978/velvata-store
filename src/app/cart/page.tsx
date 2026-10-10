"use client";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { formatPkr } from "@/lib/whatsapp";

export default function CartPage() {
  const { items, subtotal, updateQty, removeItem } = useCart();
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="relative rounded-3xl overflow-hidden h-44 sm:h-52">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/banner-cart.jpg" alt="Shopping Cart" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
        <div className="relative h-full flex flex-col justify-center px-6 sm:px-8 text-white">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold drop-shadow">Shopping Cart</h1>
          <p className="mt-1 text-white/80 text-sm">Almost yours — checkout in a minute</p>
        </div>
      </div>
      {items.length === 0 ? (
        <div className="mt-8 text-center">
          <p className="text-stone-500">Your cart is empty.</p>
          <Link href="/shop" className="inline-block mt-4 rounded-full bg-stone-900 text-white px-6 py-2.5 text-sm font-medium">
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {items.map((i) => (
            <div key={`${i.productId}-${i.size}`} className="flex gap-4 border border-stone-200 rounded-2xl p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={i.image} alt={i.name} className="h-24 w-20 object-cover rounded-xl bg-stone-100" />
              <div className="flex-1">
                <div className="font-medium">{i.name}</div>
                <div className="text-sm text-stone-500">Size: {i.size}</div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 border border-stone-200 rounded-full px-1">
                    <button className="px-2" onClick={() => updateQty(i.productId, i.size, i.qty - 1)}>−</button>
                    <span className="w-5 text-center text-sm">{i.qty}</span>
                    <button className="px-2" onClick={() => updateQty(i.productId, i.size, i.qty + 1)}>+</button>
                  </div>
                  <div className="font-semibold">{formatPkr(i.price * i.qty)}</div>
                </div>
              </div>
              <button onClick={() => removeItem(i.productId, i.size)} className="self-start text-stone-400 hover:text-red-600" aria-label="Remove">×</button>
            </div>
          ))}
          <div className="flex justify-between items-center border-t border-stone-200 pt-4">
            <span className="font-semibold text-lg">Subtotal</span>
            <span className="font-bold text-lg text-stone-950">{formatPkr(subtotal)}</span>
          </div>
          <Link href="/checkout" className="block text-center rounded-full bg-stone-950 text-white font-semibold py-3.5 hover:bg-stone-950">
            Proceed to Checkout
          </Link>
        </div>
      )}
    </div>
  );
}
