"use client";
// Global cart state (React context + localStorage persistence).
import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";

export interface CartItem {
  productId: number;
  slug: string;
  name: string;
  size: string;
  price: number; // PKR each (sale price if applicable)
  qty: number;
  image: string;
}

interface CartCtx {
  items: CartItem[];
  count: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, "qty">, qty?: number) => void;
  removeItem: (productId: number, size: string) => void;
  updateQty: (productId: number, size: string, qty: number) => void;
  clear: () => void;
  drawerOpen: boolean;
  setDrawerOpen: (v: boolean) => void;
}

const Ctx = createContext<CartCtx | null>(null);
const KEY = "garments_cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(KEY, JSON.stringify(items));
  }, [items, loaded]);

  const value = useMemo<CartCtx>(() => {
    const count = items.reduce((s, i) => s + i.qty, 0);
    const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);
    return {
      items, count, subtotal,
      addItem: (item, qty = 1) =>
        setItems((prev) => {
          const idx = prev.findIndex((p) => p.productId === item.productId && p.size === item.size);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = { ...next[idx], qty: next[idx].qty + qty };
            return next;
          }
          return [...prev, { ...item, qty }];
        }),
      removeItem: (productId, size) =>
        setItems((prev) => prev.filter((p) => !(p.productId === productId && p.size === size))),
      updateQty: (productId, size, qty) =>
        setItems((prev) =>
          qty <= 0
            ? prev.filter((p) => !(p.productId === productId && p.size === size))
            : prev.map((p) => (p.productId === productId && p.size === size ? { ...p, qty } : p))
        ),
      clear: () => setItems([]),
      drawerOpen, setDrawerOpen,
    };
  }, [items, drawerOpen]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart(): CartCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
