"use client";
import { use, useEffect, useState } from "react";
import BlogForm, { type BlogFormData } from "../BlogForm";

export default function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [initial, setInitial] = useState<BlogFormData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/admin/posts/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.post) throw new Error("Article not found");
        setInitial({
          id: d.post.id,
          title: d.post.title ?? "",
          slug: d.post.slug ?? "",
          excerpt: d.post.excerpt ?? "",
          body: d.post.body ?? "",
          coverImage: d.post.coverImage ?? "",
          status: d.post.status ?? "draft",
          metaDescription: d.post.metaDescription ?? "",
        });
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Load failed"));
  }, [id]);

  if (error) return <p className="mt-6 text-red-600">{error}</p>;
  if (!initial) return <p className="mt-6 text-stone-500">Loading…</p>;

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-stone-900">Edit Article</h1>
      <BlogForm initial={initial} isNew={false} />
    </div>
  );
}
