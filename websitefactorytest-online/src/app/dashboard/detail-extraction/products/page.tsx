"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Product = {
  id: number;
  url: string;
  slug: string;
  title: string;
  category: string;
  brand: string;
  sku: string;
  status: string;
  extraction_time_ms: number;
  images_json: string;
  seo_json: string;
  schema_json: string;
  specifications_json: string;
  faq_json: string;
};

export default function ExtractedProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("/api/detail-extraction", { cache: "no-store" })
      .then(r => r.json())
      .then(d => setProducts(d.products || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = products.filter(p => {
    if (filter === "completed" && p.status !== "completed") return false;
    if (filter === "failed" && p.status !== "failed") return false;
    if (search) {
      const q = search.toLowerCase();
      return p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q) || p.url.toLowerCase().includes(q) || (p.brand || "").toLowerCase().includes(q);
    }
    return true;
  });

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" /></div>;

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Extracted Products</h2>
          <p className="mt-1 text-sm text-gray-600">{filtered.length} shown | {products.length} total</p>
        </div>
        <Link href="/dashboard/detail-extraction" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">Back</Link>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
        <select value={filter} onChange={e => setFilter(e.target.value)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none">
          <option value="all">All ({products.length})</option>
          <option value="completed">Completed ({products.filter(p => p.status === "completed").length})</option>
          <option value="failed">Failed ({products.filter(p => p.status === "failed").length})</option>
        </select>
      </div>

      {filtered.length > 0 ? (
        <div className="overflow-x-auto rounded-xl bg-white shadow">
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 font-medium text-gray-500">Product</th>
              <th className="px-4 py-3 font-medium text-gray-500">Category</th>
              <th className="px-4 py-3 font-medium text-gray-500">Brand</th>
              <th className="px-4 py-3 font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 font-medium text-gray-500">Time</th>
            </tr></thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="max-w-sm px-4 py-3">
                    <div className="font-medium text-gray-900">{p.title || p.slug}</div>
                    <div className="truncate font-mono text-xs text-gray-500">{p.url}</div>
                  </td>
                  <td className="px-4 py-3"><span className="rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700">{p.category || "-"}</span></td>
                  <td className="px-4 py-3 text-sm text-gray-600">{p.brand || "-"}</td>
                  <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                  <td className="px-4 py-3 text-sm text-gray-500">{p.extraction_time_ms ? `${p.extraction_time_ms}ms` : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl bg-white p-12 text-center shadow"><p className="text-gray-600">No products found.</p></div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    completed: "bg-green-100 text-green-700", failed: "bg-red-100 text-red-700",
    extracting: "bg-yellow-100 text-yellow-700", pending: "bg-gray-100 text-gray-700",
  };
  return <span className={`rounded-full px-2 py-1 text-xs font-bold ${styles[status] ?? "bg-gray-100 text-gray-700"}`}>{status}</span>;
}
