"use client";
// Product star ratings — VERIFIED PURCHASE ONLY. Only logged-in customers who
// actually bought the product can rate it, so fake reviews are impossible.
import { useEffect, useState } from "react";

interface Review {
  id: number; name: string; rating: number; title: string; body: string; createdAt: string;
}

interface Viewer {
  loggedIn: boolean; canRate: boolean; myRating: number | null;
}

function Stars({ n, size = "text-base" }: { n: number; size?: string }) {
  return (
    <span className={`${size} text-babli-gold tracking-tight`}>
      {"★".repeat(n)}{"☆".repeat(5 - n)}
    </span>
  );
}

export default function Reviews({ productId }: { productId: number }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [viewer, setViewer] = useState<Viewer>({ loggedIn: false, canRate: false, myRating: null });
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function load() {
    fetch(`/api/reviews?productId=${productId}`)
      .then((r) => r.json())
      .then((d) => {
        setReviews(d.reviews || []);
        if (d.viewer) {
          setViewer(d.viewer);
          if (d.viewer.myRating) setRating(d.viewer.myRating);
        }
      })
      .catch(() => {});
  }

  useEffect(load, [productId]);

  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, rating, comment: comment.trim() }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Could not submit rating");
      setSent(true);
      setComment("");
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not submit rating");
    }
    setBusy(false);
  }

  const input = "w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-babli";

  return (
    <div className="mt-12 scroll-mt-24" id="reviews">
      <h2 className="font-serif text-2xl font-bold text-stone-900">Ratings &amp; Reviews</h2>
      {reviews.length > 0 ? (
        <>
          <div className="mt-2 flex items-center gap-2">
            <Stars n={Math.round(avg)} size="text-xl" />
            <span className="text-sm text-stone-500">{avg.toFixed(1)} · {reviews.length} rating{reviews.length === 1 ? "" : "s"}</span>
          </div>
          <div className="mt-4 space-y-4">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-2xl border border-stone-200 p-4">
                <div className="flex items-center justify-between gap-2">
                  <Stars n={r.rating} />
                  <span className="text-xs text-stone-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                </div>
                {r.title && <div className="mt-1 font-semibold text-stone-900">{r.title}</div>}
                {r.body && <p className="mt-1 text-sm text-stone-600">{r.body}</p>}
                <div className="mt-2 text-xs text-stone-500">
                  — {r.name} <span className="text-stone-950 font-medium">✓ Customer</span>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="mt-2 text-sm text-stone-500">No ratings yet — bought this? Be the first to rate it!</p>
      )}

      <div className="mt-6 rounded-2xl bg-stone-50 border border-stone-200 p-5">
        <h3 className="font-semibold text-stone-900">Rate this product</h3>
        {!viewer.loggedIn ? (
          <p className="mt-2 text-sm text-stone-600">
            <a href="/account" className="font-medium text-stone-950 underline underline-offset-2">Log in</a>{" "}
            to rate this product.
          </p>
        ) : sent ? (
          <p className="mt-2 text-sm text-stone-950">✓ Thank you! Your rating has been saved.</p>
        ) : (
          <form onSubmit={submit} className="mt-3 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-stone-600">Your rating:</span>
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setRating(n)} className={`text-3xl ${n <= rating ? "text-babli-gold" : "text-stone-300"} hover:scale-110 transition`} aria-label={`${n} stars`}>
                  ★
                </button>
              ))}
            </div>
            {viewer.myRating ? (
              <p className="text-xs text-stone-500">You rated this {viewer.myRating}★ — tap stars to update.</p>
            ) : null}
            <textarea className={input} rows={2} placeholder="Say something nice (optional)" value={comment} onChange={(e) => setComment(e.target.value)} maxLength={500} />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={busy} className="btn-babli px-6 py-2.5 text-sm disabled:opacity-50">
              {busy ? "Saving…" : viewer.myRating ? "Update Rating" : "Submit Rating"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
