import type { Metadata } from "next";

const SITE_URL = (process.env.SITE_URL || "https://www.qomashwears.store").replace(/\/$/, "");

export const metadata: Metadata = {
  title: "Shop All — Women's & Men's Fashion | Qomash Wears",
  description:
    "Shop Qomash Wears: premium embroidered suits, casual wear, winter collection, footwear & accessories online in Pakistan. COD available, 14-day exchange.",
  alternates: { canonical: `${SITE_URL}/shop` },
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
