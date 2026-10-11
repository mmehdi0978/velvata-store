import type { Metadata } from "next";
import { Cinzel_Decorative, Marcellus, Playfair_Display, Cormorant_Garamond, Bebas_Neue, Anton, Oswald, Montserrat, Bodoni_Moda, Italiana, Cinzel, Abril_Fatface, Raleway, Poppins, DM_Serif_Display, Libre_Baskerville, Josefin_Sans, Archivo_Black, Alfa_Slab_One, Lato } from "next/font/google";
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

const cinzelDecorative = Cinzel_Decorative({
  weight: ["700", "900"],
  subsets: ["latin"],
  variable: "--font-logo",
});

const marcellus = Marcellus({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-luxury",
});

const playfair = Playfair_Display({
  weight: ["700", "900"],
  subsets: ["latin"],
  variable: "--font-playfair",
});

const cormorant = Cormorant_Garamond({
  weight: ["600", "700"],
  subsets: ["latin"],
  variable: "--font-cormorant",
});

const bebas = Bebas_Neue({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-bebas",
});

const anton = Anton({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-anton",
});

const oswald = Oswald({
  weight: ["600", "700"],
  subsets: ["latin"],
  variable: "--font-oswald",
});

const montserrat = Montserrat({
  weight: ["700", "800"],
  subsets: ["latin"],
  variable: "--font-montserrat",
});

const bodoni = Bodoni_Moda({
  weight: ["700", "800"],
  subsets: ["latin"],
  variable: "--font-bodoni",
});

const italiana = Italiana({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-italiana",
});

const cinzelReg = Cinzel({
  weight: ["700", "900"],
  subsets: ["latin"],
  variable: "--font-cinzelreg",
});

const abril = Abril_Fatface({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-abril",
});

const raleway = Raleway({
  weight: ["700", "800"],
  subsets: ["latin"],
  variable: "--font-raleway",
});

const poppins = Poppins({
  weight: ["700", "800"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

const dmserif = DM_Serif_Display({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-dmserif",
});

const libre = Libre_Baskerville({
  weight: ["700"],
  subsets: ["latin"],
  variable: "--font-libre",
});

const josefin = Josefin_Sans({
  weight: ["600", "700"],
  subsets: ["latin"],
  variable: "--font-josefin",
});

const archivo = Archivo_Black({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-archivo",
});

const alfa = Alfa_Slab_One({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-alfa",
});

const lato = Lato({
  weight: ["700", "900"],
  subsets: ["latin"],
  variable: "--font-lato",
});

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
      <body className={`${cinzelDecorative.variable} ${marcellus.variable} ${playfair.variable} ${cormorant.variable} ${bebas.variable} ${anton.variable} ${oswald.variable} ${montserrat.variable} ${bodoni.variable} ${italiana.variable} ${cinzelReg.variable} ${abril.variable} ${raleway.variable} ${poppins.variable} ${dmserif.variable} ${libre.variable} ${josefin.variable} ${archivo.variable} ${alfa.variable} ${lato.variable}`}>
        <CartProvider>
          <WishlistProvider>
            <Navbar
              storeName={s.store_name}
              logoPath={s.logo_path}
              announcement={s.announcement_text}
              phone={s.support_phone}
              theme={{
                logoText: s.logo_text,
                logoColor: s.logo_color,
                logoFont: s.logo_font,
                logoSize: s.logo_size,
                logoSpacing: s.logo_spacing,
                headerBg: s.header_bg,
              }}
            />
            <main className="min-h-[70vh]">{children}</main>
            <Footer storeName={s.store_name} tagline={s.store_tagline} phone={s.support_phone} />
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
