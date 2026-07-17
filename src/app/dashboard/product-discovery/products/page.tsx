"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Product = {
  id: number;
  url: string;
  product_slug: string;
  product_name: string;
  category: string;
  status: string;
  priority: number;
  price: string | null;
  sku: string | null;
  image_url: string | null;
  in_stock: number;
  is_duplicate: number;
  duplicate_of: string | null;
  discovered_by: string;
  source_page: string;
  status_code: number | null;
};

type FilterType = "all" | "unique" | "duplicate" | "broken" | string;

export default function ProductUrlsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/product-discovery", { cache: "no-store" });
        const data = await res.json();
        setProducts(data.products || []);
        setCategories(Object.keys(data.productsByCategory || {}).sort());
      } catch (err) {
        console.error("Failed to load products:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = products.filter((p) => {
    if (filter === "unique" && p.is_duplicate !== 0) return false;
    if (filter === "duplicate" && p.is_duplicate !== 1) return false;
    if (filter === "broken" && p.status !== "broken") return false;
    if (filter !== "all" && filter !== "unique" && filter !== "duplicate" && filter !== "broken" && p.category !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        p.url.toLowerCase().includes(q) ||
        p.product_name.toLowerCase().includes(q) ||
        p.product_slug.toLowerCase().includes(q) ||
        (p.sku || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  const uniqueCount = products.filter(p => !p.is_duplicate).length;
  const dupCount = products.filter(p => p.is_duplicate).length;

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Product URLs</h2>
          <p className="mt-1 text-sm text-gray-600">
            {filtered.length} shown | {uniqueCount} unique | {dupCount} duplicates
          </p>
        </div>
        <Link
          href="/dashboard/product-discovery"
          className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
        >
          Back to Product Discovery
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
        >
          <option value="all">All ({products.length})</option>
          <option value="unique">Unique Only ({uniqueCount})</option>
          <option value="duplicate">Duplicates ({dupCount})</option>
          <option value="broken">Broken ({products.filter(p => p.status === "broken").length})</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat} ({products.filter(p => p.category === cat).length})
            </option>
          ))}
        </select>
      </div>

      {/* Product Table */}
      {filtered.length > 0 ? (
        <div className="overflow-x-auto rounded-xl bg-white shadow">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 font-medium text-gray-500">Product</th>
                <th className="px-4 py-3 font-medium text-gray-500">Category</th>
                <th className="px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 font-medium text-gray-500">Price</th>
                <th className="px-4 py-3 font-medium text-gray-500">SKU</th>
                <th className="px-4 py-3 font-medium text-gray-500">Source</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="max-w-sm px-4 py-3">
                    <div className="font-medium text-gray-900">{item.product_name || item.product_slug}</div>
                    <div className="truncate font-mono text-xs text-gray-500">{item.url}</div>
                    {item.is_duplicate === 1 && item.duplicate_of && (
                      <div className="mt-1 text-xs text-orange-500">Duplicate of: {item.duplicate_of}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={item.status} isDuplicate={item.is_duplicate === 1} />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.price ?? "-"}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{item.sku ?? "-"}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{item.discovered_by}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl bg-white p-12 text-center shadow">
          <p className="text-gray-600">
            {search || filter !== "all" ? "No products match your filters." : "No products discovered yet."}
          </p>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status, isDuplicate }: { status: string; isDuplicate: boolean }) {
  if (isDuplicate) {
    return <span className="rounded-full bg-orange-100 px-2 py-1 text-xs font-bold text-orange-700">duplicate</span>;
  }

  const styles: Record<string, string> = {
    crawled: "bg-green-100 text-green-700",
    discovered: "bg-yellow-100 text-yellow-700",
    broken: "bg-red-100 text-red-700",
    failed: "bg-red-100 text-red-700",
  };

  return (
    <span className={`rounded-full px-2 py-1 text-xs font-bold ${styles[status] ?? "bg-gray-100 text-gray-700"}`}>
      {status}
    </span>
  );
}
