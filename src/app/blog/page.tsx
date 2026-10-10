import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Journal — Qomash Wears",
  description: "Style guides, fabric explainers and care tips for Pakistani women's fashion.",
};

interface PostSummary {
  id: number; slug: string; title: string; excerpt: string;
  coverImage: string; createdAt: string;
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  } catch { return ""; }
}

export default async function BlogPage() {
  let posts: PostSummary[] = [];
  try {
    const db = (await import("@/lib/db")).getDb;
    const rows = (await (await db()).prepare(
      "SELECT id, slug, title, excerpt, cover_image, created_at FROM posts WHERE status = 'published' ORDER BY created_at DESC"
    ).all()) as Record<string, unknown>[];
    posts = rows.map((r) => ({
      id: r.id as number, slug: r.slug as string, title: r.title as string,
      excerpt: (r.excerpt as string) ?? "", coverImage: (r.cover_image as string) ?? "",
      createdAt: r.created_at as string,
    }));
  } catch { /* show empty state */ }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <p className="text-[11px] uppercase tracking-[0.35em] text-stone-500 text-center">Qomash Wears</p>
      <h1 className="mt-2 text-3xl sm:text-4xl font-bold uppercase tracking-[0.12em] text-stone-950 text-center">Journal</h1>
      <p className="mt-3 text-stone-600 text-center font-light max-w-xl mx-auto">
        Style guides, fabric explainers and care tips for Pakistani women&apos;s fashion.
      </p>

      {posts.length === 0 ? (
        <p className="mt-16 text-center text-stone-400 font-light">No articles yet — check back soon.</p>
      ) : (
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <Link key={p.id} href={`/blog/${p.slug}`} className="group block">
              <div className="aspect-[4/3] overflow-hidden bg-stone-100">
                {p.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.coverImage} alt={p.title} className="h-full w-full object-cover group-hover:scale-105 transition duration-500" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <span className="text-[11px] uppercase tracking-[0.35em] text-stone-400">Qomash Wears</span>
                  </div>
                )}
              </div>
              <p className="mt-4 text-[11px] uppercase tracking-[0.25em] text-stone-400">{fmtDate(p.createdAt)}</p>
              <h2 className="mt-1.5 text-lg font-semibold text-stone-950 leading-snug group-hover:underline underline-offset-4">{p.title}</h2>
              {p.excerpt && <p className="mt-2 text-sm text-stone-600 font-light line-clamp-2">{p.excerpt}</p>}
              <span className="mt-3 inline-block text-xs uppercase tracking-[0.2em] text-stone-950 font-semibold">Read →</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
