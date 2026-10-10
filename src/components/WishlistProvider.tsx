"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface WishlistCtx {
  ids: number[];
  toggle: (id: number) => void;
  has: (id: number) => boolean;
  count: number;
}

const Ctx = createContext<WishlistCtx>({ ids: [], toggle: () => {}, has: () => false, count: 0 });
const KEY = "velvata_wishlist";

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<number[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setIds(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch { /* ignore */ }
  }, [ids]);
  const toggle = (id: number) => setIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const has = (id: number) => ids.includes(id);
  return <Ctx.Provider value={{ ids, toggle, has, count: ids.length }}>{children}</Ctx.Provider>;
}

export function useWishlist() {
  return useContext(Ctx);
}
