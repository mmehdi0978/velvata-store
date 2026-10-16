import type { Metadata } from "next";

const SITE_URL = (process.env.SITE_URL || "https://www.qomashwears.store").replace(/\/$/, "");

export const metadata: Metadata = {
  title: "Contact Us | Qomash Wears",
  description:
    "Contact Qomash Wears — WhatsApp, email and support hours (Mon–Sat, 9am–6pm). We reply fast about orders, sizing and exchanges.",
  alternates: { canonical: `${SITE_URL}/contact` },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
