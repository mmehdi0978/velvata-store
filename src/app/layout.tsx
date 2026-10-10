import type { Metadata } from "next";
import { CartProvider } from "@/components/CartProvider";
import { WishlistProvider } from "@/components/WishlistProvider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import Chatbot from "@/components/Chatbot";
import MobileBridge from "@/components/MobileBridge";
import { getPublicSettingsSafe } from "@/lib/settings";
import "./globals.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getPublicSettingsSafe();
  return {
    title: `${s.store_name} — Premium Women's Fashion Pakistan`,
    description: s.store_tagline,
    icons: {
      icon: "/favicon.ico",
      apple: "/apple-touch-icon.png",
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const s = await getPublicSettingsSafe();
  return (
    <html lang="en">
      <body>
        <CartProvider>
          <WishlistProvider>
            <Navbar
              storeName={s.store_name}
              logoPath={s.logo_path}
              announcement={s.announcement_text}
              phone={s.support_phone}
            />
            <main className="min-h-[70vh]">{children}</main>
            <Footer storeName={s.store_name} tagline={s.store_tagline} />
            <CartDrawer />
            <WhatsAppFloat />
            <Chatbot />
            <MobileBridge />
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}
