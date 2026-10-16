"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Sets a per-path canonical <link> in <head> (query strings stripped).
// Using a client component keeps each page's canonical correct — a static
// `alternates.canonical` in the root layout would wrongly point every page at "/".
export default function CanonicalTag({ base }: { base: string }) {
  const pathname = usePathname();
  useEffect(() => {
    const href = base.replace(/\/$/, "") + (pathname || "/");
    let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", href);
  }, [base, pathname]);
  return null;
}
