"use client";
// Runs only inside the native app wrapper. Handles:
//  - Android hardware back button → go back in WebView history (exit only at root)
//  - External links (WhatsApp wa.me, etc.) → open in system browser / apps,
//    never trapped inside the WebView
//  - Status bar styling to match the brand
import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";

export default function MobileBridge() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let cleanup: (() => void) | undefined;

    (async () => {
      const [{ App }, { Browser }, { StatusBar, Style }] = await Promise.all([
        import("@capacitor/app"),
        import("@capacitor/browser"),
        import("@capacitor/status-bar"),
      ]);

      try {
        await StatusBar.setBackgroundColor({ color: "#064e3b" });
        await StatusBar.setStyle({ style: Style.Dark });
      } catch {
        /* status bar not available — ignore */
      }

      // Route external links (WhatsApp, etc.) to the system browser/apps.
      const onClick = (e: MouseEvent) => {
        const anchor = (e.target as HTMLElement).closest("a");
        if (!anchor) return;
        const href = anchor.getAttribute("href") || "";
        if (!/^https?:\/\//i.test(href)) return;
        let external = false;
        try {
          const u = new URL(href);
          external =
            u.hostname !== window.location.hostname ||
            /^(wa\.me|api\.whatsapp\.com|www\.wa\.me)$/i.test(u.hostname);
        } catch {
          external = false;
        }
        if (external) {
          e.preventDefault();
          Browser.open({ url: href }).catch(() => {
            window.location.href = href;
          });
        }
      };
      document.addEventListener("click", onClick);

      const sub = await App.addListener("backButton", ({ canGoBack }) => {
        if (canGoBack) {
          window.history.back();
        } else {
          App.minimizeApp();
        }
      });

      cleanup = () => {
        document.removeEventListener("click", onClick);
        sub.remove();
      };
    })().catch(() => {});

    return () => cleanup?.();
  }, []);

  return null;
}
