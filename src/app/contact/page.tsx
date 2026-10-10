"use client";
import { useState } from "react";

export const dynamic = "force-dynamic";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !form.name.trim() || !form.email.includes("@") || !form.message.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSent(true);
        setForm({ name: "", email: "", phone: "", message: "" });
      }
    } catch { /* ignore */ }
    setBusy(false);
  }

  function field(label: string, key: keyof typeof form, type = "text", required = true) {
    return (
      <label className="block">
        <span className="text-sm font-medium text-stone-700">{label}{required && " *"}</span>
        <input
          type={type}
          required={required}
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          className="mt-1 w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-babli"
        />
      </label>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="font-serif text-3xl font-bold text-stone-900">Contact Us</h1>
      <p className="mt-2 text-stone-600 text-[15px]">
        Have a question about an order, sizing, or our shipping policy? Send us a message —
        our customer support team replies within one working day.
      </p>

      {sent ? (
        <div className="mt-8 rounded-2xl bg-green-50 border border-green-200 p-6 text-center">
          <div className="text-3xl">✓</div>
          <p className="mt-2 font-medium text-green-800">Message received!</p>
          <p className="text-sm text-green-700">We'll get back to you shortly.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            {field("Full Name", "name")}
            {field("Email", "email", "email")}
          </div>
          {field("Phone Number", "phone", "tel", false)}
          <label className="block">
            <span className="text-sm font-medium text-stone-700">Additional Comments *</span>
            <textarea
              required
              rows={5}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="mt-1 w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-babli"
              placeholder="How can we help?"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="rounded-full bg-stone-950 text-white px-8 py-3 text-sm font-medium hover:bg-stone-800 disabled:opacity-50"
          >
            {busy ? "Sending…" : "Send Message"}
          </button>
        </form>
      )}

      <div className="mt-12 grid sm:grid-cols-3 gap-6 border-t border-stone-200 pt-8">
        <div>
          <div className="font-semibold text-stone-900">Phone</div>
          <p className="mt-1 text-sm text-stone-600">MON–SAT, 9:00 TO 6:00</p>
          <p className="mt-1 text-sm text-stone-600">Call us during working hours</p>
        </div>
        <div>
          <div className="font-semibold text-stone-900">WhatsApp</div>
          <p className="mt-1 text-sm text-stone-600">Fastest response — chat with us anytime</p>
        </div>
        <div>
          <div className="font-semibold text-stone-900">Email Us</div>
          <p className="mt-1 text-sm text-stone-600">For order queries and support</p>
        </div>
      </div>
    </div>
  );
}
