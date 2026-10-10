"use client";
import { useState } from "react";
import PolicyLayout from "@/components/PolicyLayout";

const FAQS: { q: string; a: string }[] = [
  {
    q: "How long does my order take to arrive?",
    a: "Orders are dispatched within 24–48 hours. Delivery takes 3–5 working days across Pakistan. You'll receive tracking details by SMS/WhatsApp once your parcel ships.",
  },
  {
    q: "How can I track my order?",
    a: "Once your order ships, we send you a tracking number. You can also check your order status anytime from the Track Order page or your account.",
  },
  {
    q: "Which payment methods do you accept?",
    a: "We accept Cash on Delivery (COD), JazzCash and Easypaisa. Online card payments are coming soon.",
  },
  {
    q: "How do I choose the right size?",
    a: "Every product page has a size chart with chest, waist and length measurements in inches. Our ready-to-wear suits follow standard Pakistani sizing (XS–XL). If you're between sizes, we recommend sizing up — or message us on WhatsApp and we'll help you pick.",
  },
  {
    q: "What is your exchange & return policy?",
    a: "We offer a 14-day easy exchange on unused items with tags intact. Sale items are final sale unless damaged or incorrect. Start an exchange from your account or contact us on WhatsApp.",
  },
  {
    q: "Are the product colors accurate?",
    a: "We photograph every article in natural light, but slight color variation can occur due to screen settings. The actual fabric is always as described — if anything arrives different from what was promised, we'll make it right.",
  },
  {
    q: "Do you deliver to my city?",
    a: "Yes — we deliver to every city and town in Pakistan via trusted couriers. Shipping is a flat Rs 250, and FREE on orders above Rs 3,000.",
  },
  {
    q: "Can I cancel or change my order?",
    a: "You can cancel or modify your order within 12 hours of placing it, before it's dispatched. Just contact us with your order number.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-stone-200 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-stone-50"
      >
        <span className="font-medium text-stone-900 text-[15px]">{q}</span>
        <span className={`text-stone-400 transition-transform ${open ? "rotate-45" : ""} text-xl leading-none`}>+</span>
      </button>
      {open && <p className="px-5 pb-5 text-sm text-stone-600 leading-relaxed">{a}</p>}
    </div>
  );
}

export default function FaqPage() {
  return (
    <PolicyLayout title="Frequently Asked Questions" updated="October 2026">
      <div className="space-y-3">
        {FAQS.map((f) => (
          <FaqItem key={f.q} q={f.q} a={f.a} />
        ))}
      </div>
      <p className="pt-2 text-sm">
        Still have a question? <a href="/contact" className="font-medium text-stone-900 underline">Contact us</a> —
        we reply within one working day.
      </p>
    </PolicyLayout>
  );
}
