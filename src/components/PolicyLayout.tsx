export default function PolicyLayout({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="font-serif text-3xl font-bold text-stone-900">{title}</h1>
      <p className="mt-1 text-xs text-stone-400">Last updated: {updated}</p>
      <div className="mt-6 space-y-4 text-stone-600 leading-relaxed text-[15px]">{children}</div>
    </div>
  );
}
