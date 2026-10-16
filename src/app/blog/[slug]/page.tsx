import Link from "next/link";
import type { Metadata } from "next";
import { getDb, mapPost } from "@/lib/db";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

async function getPost(slug: string) {
  const row = await (await getDb())
    .prepare("SELECT * FROM posts WHERE slug = ? AND status = 'published'")
    .get(slug) as Record<string, unknown> | undefined;
  return row ? mapPost(row) : null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Article — Qomash Wears" };
  return {
    title: `${post.title} — Qomash Wears`,
    description: post.metaDescription || post.excerpt || post.title,
    alternates: { canonical: `https://www.qomashwears.store/blog/${slug}` },
  };
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  } catch { return ""; }
}

// Plain-text body → paragraphs; "## " prefix → subheading. No markdown library.
function Body({ text }: { text: string }) {
  const blocks = text.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  const els: React.ReactNode[] = [];
  blocks.forEach((b, i) => {
    if (b.startsWith("## ")) {
      const nl = b.indexOf("\n");
      const head = (nl === -1 ? b.slice(3) : b.slice(3, nl)).trim();
      const rest = nl === -1 ? "" : b.slice(nl + 1).trim();
      els.push(
        <h2 key={`h${i}`} className="mt-10 mb-4 text-xl font-bold uppercase tracking-[0.08em] text-stone-950">
          {head}
        </h2>
      );
      if (rest) els.push(<p key={`p${i}`} className="mt-5 text-stone-700 leading-relaxed font-light">{rest}</p>);
    } else {
      els.push(<p key={i} className="mt-5 text-stone-700 leading-relaxed font-light">{b}</p>);
    }
  });
  return <div>{els}</div>;
}

export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  return (
    <article className="max-w-3xl mx-auto px-4 py-10">
      <Link href="/blog" className="text-xs uppercase tracking-[0.2em] text-stone-500 hover:text-stone-950">← Journal</Link>
      <p className="mt-6 text-[11px] uppercase tracking-[0.25em] text-stone-400">{fmtDate(post.createdAt)}</p>
      <h1 className="mt-2 text-3xl sm:text-4xl font-bold text-stone-950 leading-tight">{post.title}</h1>
      {post.excerpt && <p className="mt-4 text-lg text-stone-600 font-light leading-relaxed">{post.excerpt}</p>}
      {post.coverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.coverImage} alt={post.title} className="mt-8 w-full aspect-[16/9] object-cover bg-stone-100" />
      )}
      <div className="mt-4">
        <Body text={post.body} />
      </div>
      <div className="mt-12 border-t border-stone-200 pt-8 text-center">
        <p className="text-[11px] uppercase tracking-[0.35em] text-stone-400">Qomash Wears</p>
        <Link href="/shop" className="mt-4 inline-block rounded-full bg-stone-950 text-white font-semibold px-10 py-3.5 text-sm uppercase tracking-[0.18em] hover:bg-stone-800 transition">
          Shop the Collection
        </Link>
      </div>
    </article>
  );
}
