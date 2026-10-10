"use client";
import { useEffect, useState } from "react";

interface Review {
  id: number; product_id: number; name: string; rating: number;
  title: string; body: string; approved: number; created_at: string;
  product_name: string; product_slug: string;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    fetch("/api/admin/reviews")
      .then((r) => r.json())
      .then((d) => setReviews(d.reviews || []))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function act(id: number, action: "approve" | "delete") {
    await fetch("/api/admin/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    load();
  }

  const pending = reviews.filter((r) => !r.approved);

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-stone-900">Ratings</h1>
      <p className="mt-1 text-sm text-stone-500">
        {pending.length} pending approval · {reviews.length} total · all from verified purchases
      </p>
      {loading ? (
        <p className="mt-6 text-stone-500">Loading…</p>
      ) : reviews.length === 0 ? (
        <p className="mt-6 text-stone-500">No reviews yet.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className={`rounded-2xl border p-4 ${r.approved ? "border-stone-200 bg-white" : "border-amber-300 bg-amber-50"}`}>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="text-sm">
                  <span className="text-amber-500">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                  <span className="ml-2 font-semibold">{r.name}</span>
                  <span className="ml-2 text-stone-500 text-xs">on {r.product_name || `#${r.product_id}`}</span>
                </div>
                {!r.approved && <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-full">PENDING</span>}
              </div>
              {r.title && <div className="mt-1 font-medium text-stone-900 text-sm">{r.title}</div>}
              <p className="mt-1 text-sm text-stone-600">{r.body}</p>
              <div className="mt-3 flex gap-2">
                {!r.approved && (
                  <button onClick={() => act(r.id, "approve")} className="rounded-full bg-stone-950 text-white text-xs font-medium px-4 py-1.5 hover:bg-stone-950">
                    Approve
                  </button>
                )}
                <button onClick={() => act(r.id, "delete")} className="rounded-full border border-red-300 text-red-600 text-xs font-medium px-4 py-1.5 hover:bg-red-50">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
