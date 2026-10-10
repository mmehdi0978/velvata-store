"use client";
import { useEffect, useState } from "react";

interface Customer {
  id: number; name: string; email: string; verified: boolean; createdAt: string; orders: number;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/customers")
      .then((r) => r.json())
      .then((d) => setCustomers(d.customers || []))
      .finally(() => setLoading(false));
  }, []);

  const verified = customers.filter((c) => c.verified).length;

  return (
    <div>
      <div>
        <h1 className="font-serif text-2xl font-bold text-stone-900">Customers</h1>
        <p className="mt-1 text-sm text-stone-500">
          {customers.length} registered · {verified} verified · {customers.length - verified} pending verification
        </p>
      </div>

      {loading ? (
        <p className="mt-6 text-stone-500">Loading…</p>
      ) : customers.length === 0 ? (
        <p className="mt-6 text-stone-500">No customer accounts yet.</p>
      ) : (
        <div className="mt-6 rounded-2xl border border-stone-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-stone-500 border-b border-stone-200">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Orders</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="border-b border-stone-100 last:border-0">
                    <td className="px-4 py-3 font-medium text-stone-900">{c.name}</td>
                    <td className="px-4 py-3 text-stone-600">{c.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${c.verified ? "bg-stone-200 text-stone-800" : "bg-amber-100 text-amber-800"}`}>
                        {c.verified ? "Verified" : "Pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-stone-600">{c.orders}</td>
                    <td className="px-4 py-3 text-stone-500">{new Date(c.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
