"use client";
import BlogForm, { type BlogFormData } from "../BlogForm";

const EMPTY: BlogFormData = {
  title: "", slug: "", excerpt: "", body: "",
  coverImage: "", status: "draft", metaDescription: "",
};

export default function NewBlogPostPage() {
  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-stone-900">New Article</h1>
      <BlogForm initial={EMPTY} isNew />
    </div>
  );
}
