"use client";
// Floating social buttons (WhatsApp, Facebook, Instagram), shown on every storefront page.
import { useEffect, useState } from "react";
import { buildWhatsAppChatLink } from "@/lib/whatsapp";

export default function WhatsAppFloat() {
  const [s, setS] = useState({ whatsapp_number: "", facebook_url: "", instagram_url: "" });
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) =>
        setS({
          whatsapp_number: d.whatsapp_number || "",
          facebook_url: d.facebook_url || "",
          instagram_url: d.instagram_url || "",
        })
      )
      .catch(() => {});
  }, []);
  const buttons = [];
  if (s.whatsapp_number) {
    buttons.push(
      <a
        key="wa"
        href={buildWhatsAppChatLink(s.whatsapp_number)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="h-14 w-14 rounded-full bg-[#25D366] shadow-lg grid place-items-center hover:scale-105 transition-transform"
      >
        <svg viewBox="0 0 32 32" className="h-8 w-8 fill-white">
          <path d="M16 3C9.4 3 4 8.4 4 15c0 2.4.7 4.6 1.9 6.5L4 29l7.7-1.8c1.8 1 3.9 1.6 6.3 1.6 6.6 0 12-5.4 12-12S22.6 3 16 3zm0 21.8c-2 0-3.9-.5-5.5-1.5l-.4-.2-4.6 1.1 1.2-4.4-.3-.4c-1.1-1.7-1.7-3.7-1.7-5.7C6.7 9.9 11.2 5.4 16 5.4S25.3 9.9 25.3 15 21.4 24.8 16 24.8zm5.4-7.4c-.3-.2-1.8-.9-2-1-.3-.1-.5-.2-.7.1-.2.3-.8 1-1 1.2-.2.2-.4.3-.7.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2-.2-.3 0-.5.1-.6l.5-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.2-.7-1.7-1-2.3-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.2-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.1-.3-.2-.6-.3z" />
        </svg>
      </a>
    );
  }
  if (s.facebook_url) {
    buttons.push(
      <a
        key="fb"
        href={s.facebook_url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Follow on Facebook"
        className="h-14 w-14 rounded-full bg-[#1877F2] shadow-lg grid place-items-center hover:scale-105 transition-transform"
      >
        <svg viewBox="0 0 32 32" className="h-8 w-8 fill-white">
          <path d="M22 16.5h-4v11h-4.5v-11H10V12h3.5V9.2c0-3 1.8-4.7 4.6-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9V12H22l-.5 4.5z" />
        </svg>
      </a>
    );
  }
  if (s.instagram_url) {
    buttons.push(
      <a
        key="ig"
        href={s.instagram_url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Follow on Instagram"
        className="h-14 w-14 rounded-full shadow-lg grid place-items-center hover:scale-105 transition-transform"
        style={{ background: "linear-gradient(45deg, #F58529, #DD2A7B, #8134AF, #515BD4)" }}
      >
        <svg viewBox="0 0 32 32" className="h-8 w-8 fill-white">
          <path d="M16 7c-2.4 0-2.7 0-3.7.1-1 .1-1.6.2-2.2.4-.6.2-1.1.6-1.6 1.1-.5.5-.8 1-1.1 1.6-.2.6-.3 1.2-.4 2.2C7 13.3 7 13.6 7 16s0 2.7.1 3.7c.1 1 .2 1.6.4 2.2.2.6.6 1.1 1.1 1.6.5.5 1 .8 1.6 1.1.6.2 1.2.3 2.2.4 1 .1 1.3.1 3.7.1s2.7 0 3.7-.1c1-.1 1.6-.2 2.2-.4.6-.2 1.1-.6 1.6-1.1.5-.5.8-1 1.1-1.6.2-.6.3-1.2.4-2.2.1-1 .1-1.3.1-3.7s0-2.7-.1-3.7c-.1-1-.2-1.6-.4-2.2-.2-.6-.6-1.1-1.1-1.6-.5-.5-1-.8-1.6-1.1-.6-.2-1.2-.3-2.2-.4C18.7 7 18.4 7 16 7zm0 2c2.4 0 2.7 0 3.6.1.9 0 1.4.2 1.7.3.4.2.7.4 1 .7.3.3.5.6.7 1 .1.3.3.8.3 1.7.1.9.1 1.2.1 3.6s0 2.7-.1 3.6c0 .9-.2 1.4-.3 1.7-.2.4-.4.7-.7 1-.3.3-.6.5-1 .7-.3.1-.8.3-1.7.3-.9.1-1.2.1-3.6.1s-2.7 0-3.6-.1c-.9 0-1.4-.2-1.7-.3-.4-.2-.7-.4-1-.7-.3-.3-.5-.6-.7-1-.1-.3-.3-.8-.3-1.7-.1-.9-.1-1.2-.1-3.6s0-2.7.1-3.6c0-.9.2-1.4.3-1.7.2-.4.4-.7.7-1 .3-.3.6-.5 1-.7.3-.1.8-.3 1.7-.3.9-.1 1.2-.1 3.6-.1zm0 2.2c-2.5 0-4.5 2-4.5 4.5s2 4.5 4.5 4.5 4.5-2 4.5-4.5-2-4.5-4.5-4.5zm0 7.4c-1.6 0-2.9-1.3-2.9-2.9s1.3-2.9 2.9-2.9 2.9 1.3 2.9 2.9-1.3 2.9-2.9 2.9zm5.8-7.6c0 .6-.5 1-1 1-.6 0-1-.4-1-1 0-.6.4-1 1-1 .5 0 1 .4 1 1z" />
        </svg>
      </a>
    );
  }
  if (!buttons.length) return null;
  return (
    <div className="fixed right-5 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-3 items-center">
      {buttons}
    </div>
  );
}
