"use client";
import { useEffect, useState } from "react";

interface Code {
  id: number; code: string; kind: string; value: number; min_order: number; active: number;
}

export default function DiscountsPage() {
  const [codes, setCodes] = useState<Code[]>([]);
  const [code, setCode] = useState("");
  const [kind, setKind] = useState("percent");
  const [value, setValue] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [error, setError] = useState("");

  function load() {
    fetch("/api/admin/discounts").then((r) => r.json()).then((d) => setCodes(d.codes || []));
  }
  useEffect(load, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/discounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, kind, value, min_order: minOrder }),
    });
    const d = await res.json();
    if (!res.ok) { setError(d.error || "Failed"); return; }
    setCode(""); setValue(""); setMinOrder(""); load();
  }

  async function toggle(c: Code) {
    await fetch("/api/admin/discounts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: c.id, active: !c.active }),
    });
    load();
  }

  async function remove(id: number) {
    if (!confirm("Delete this discount code?")) return;
    await fetch(`/api/admin/discounts?id=${id}`, { method: "DELETE" });
    load();
  }

  const input = "rounded-xl border border-stone-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900";

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-stone-900">Discount Codes</h1>
      <form onSubmit={create} className="mt-4 max-w-2xl rounded-2xl bg-white border border-stone-200 p-5 grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium">Code *
          <input className={`${input} mt-1 w-full uppercase`} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="WELCOME10" required />
        </label>
        <label className="text-sm font-medium">Type
          <select className={`${input} mt-1 w-full`} value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="percent">Percent %</option>
            <option value="fixed">Fixed Rs</option>
          </select>
        </label>
        <label className="text-sm font-medium">Value * {kind === "percent" ? "(%)" : "(Rs)"}
          <input type="number" min={1} className={`${input} mt-1 w-full`} value={value} onChange={(e) => setValue(e.target.value)} required />
        </label>
        <label className="text-sm font-medium">Min. order (Rs)
          <input type="number" min={0} className={`${input} mt-1 w-full`} value={minOrder} onChange={(e) => setMinOrder(e.target.value)} placeholder="0" />
        </label>
        {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
        <button className="sm:col-span-2 rounded-full bg-stone-950 text-white font-semibold px-6 py-2.5 hover:bg-stone-950 w-fit">
          Create Code
        </button>
      </form>

      <div className="mt-6 max-w-2xl space-y-2">
        {codes.map((c) => (
          <div key={c.id} className={`flex items-center justify-between rounded-xl border p-4 ${c.active ? "bg-white border-stone-200" : "bg-stone-50 border-stone-200 opacity-60"}`}>
            <div>
              <span className="font-mono font-bold">{c.code}</span>
              <span className="ml-3 text-sm text-stone-500">
                {c.kind === "percent" ? `${c.value}% off` : `Rs ${c.value.toLocaleString()} off`}
                {c.min_order > 0 && ` · min Rs ${c.min_order.toLocaleString()}`}
              </span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => toggle(c)} className="text-xs font-medium rounded-full border border-stone-300 px-3 py-1.5 hover:bg-stone-50">
                {c.active ? "Disable" : "Enable"}
              </button>
              <button onClick={() => remove(c.id)} className="text-xs font-medium rounded-full border border-red-300 text-red-600 px-3 py-1.5 hover:bg-red-50">
                Delete
              </button>
            </div>
          </div>
        ))}
        {codes.length === 0 && <p className="text-stone-500 text-sm">No discount codes yet.</p>}
      </div>
    </div>
  );
}
