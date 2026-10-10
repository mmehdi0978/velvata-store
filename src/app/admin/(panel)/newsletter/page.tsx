"use client";
import { useEffect, useState } from "react";

interface Subscriber {
  id: number; email: string; source: string; verified: boolean; unsubscribed: boolean; createdAt: string;
}

export default function NewsletterPage() {
  const [subs, setSubs] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    fetch("/api/admin/newsletter")
      .then((r) => r.json())
      .then((d) => setSubs(d.subscribers || []))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function remove(id: number) {
    if (!confirm("Remove this subscriber?")) return;
    await fetch("/api/admin/newsletter", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  }

  const active = subs.filter((s) => s.verified && !s.unsubscribed);
  const pending = subs.filter((s) => !s.verified && !s.unsubscribed);
  const unsub = subs.filter((s) => s.unsubscribed);

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900">Newsletter</h1>
          <p className="mt-1 text-sm text-stone-500">
            {active.length} active · {pending.length} pending confirmation · {unsub.length} unsubscribed · {subs.length} total
          </p>
        </div>
        <a
          href="/api/admin/newsletter/export"
          className="rounded-full bg-stone-900 text-white text-sm font-medium px-5 py-2.5 hover:bg-stone-700"
        >
          ⬇ Export CSV
        </a>
      </div>

      {loading ? (
        <p className="mt-6 text-stone-500">Loading…</p>
      ) : subs.length === 0 ? (
        <p className="mt-6 text-stone-500">No subscribers yet.</p>
      ) : (
        <div className="mt-6 rounded-2xl border border-stone-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50 text-left text-xs uppercase tracking-wide text-stone-500">
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Subscribed</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {subs.map((s) => (
                  <tr key={s.id} className="border-t border-stone-100">
                    <td className="px-4 py-3 font-medium">{s.email}</td>
                    <td className="px-4 py-3 text-stone-500 capitalize">{s.source}</td>
                    <td className="px-4 py-3">
                      {s.unsubscribed ? (
                        <span className="text-xs font-bold text-stone-500 bg-stone-100 px-2 py-1 rounded-full">UNSUBSCRIBED</span>
                      ) : s.verified ? (
                        <span className="text-xs font-bold text-stone-950 bg-stone-200 px-2 py-1 rounded-full">ACTIVE</span>
                      ) : (
                        <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-full">PENDING</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-stone-500 text-xs">{new Date(s.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => remove(s.id)} className="text-xs text-red-600 hover:underline">Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <p className="mt-4 text-xs text-stone-400">
        Tip: paste an unsubscribe link at the bottom of every newsletter email:{" "}
        <code className="bg-stone-100 px-1 rounded">{"{site}/api/newsletter/unsubscribe?token=SUBSCRIBER_TOKEN"}</code>
      </p>
    </div>
  );
}
