"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type RelatedItem = { slug: string; related: { url: string; name: string; imageUrl: string | null; price: string | null; relationship: string }[] };

export default function RelatedProductsPage() {
  const [items, setItems] = useState<RelatedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/detail-extraction", { cache: "no-store" })
      .then(r => r.json())
      .then(d => {
        const all: RelatedItem[] = [];
        for (const p of d.products || []) {
          try {
            const related = JSON.parse(p.related_products_json || "[]");
            if (related.length > 0) all.push({ slug: p.slug, related });
          } catch { /* skip */ }
        }
        setItems(all);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" /></div>;

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-gray-900">Related Products</h2><p className="mt-1 text-sm text-gray-600">{items.length} products with relations</p></div>
        <Link href="/dashboard/detail-extraction" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">Back</Link>
      </div>
      {items.length > 0 ? (
        <div className="space-y-4">
          {items.map((item, i) => (
            <div key={i} className="rounded-xl bg-white p-6 shadow">
              <h3 className="mb-3 text-lg font-semibold text-gray-900">{item.slug}</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {item.related.map((r, j) => (
                  <div key={j} className="rounded-lg border border-gray-200 p-3">
                    <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">{r.relationship}</span>
                    <p className="mt-2 font-medium text-gray-900">{r.name || "Unnamed"}</p>
                    <p className="truncate font-mono text-xs text-gray-500">{r.url}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl bg-white p-12 text-center shadow"><p className="text-gray-600">No related products found.</p></div>
      )}
    </div>
  );
}
