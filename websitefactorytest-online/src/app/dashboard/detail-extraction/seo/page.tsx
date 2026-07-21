"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type SEOItem = { slug: string; url: string; seo: { title: string; metaDescription: string; canonical: string | null; ogTitle: string | null; ogDescription: string | null; ogImage: string | null; twitterCard: string | null; }; hasSchema: boolean };

export default function SEOPage() {
  const [items, setItems] = useState<SEOItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/detail-extraction", { cache: "no-store" })
      .then(r => r.json())
      .then(d => {
        const all: SEOItem[] = [];
        for (const p of d.products || []) {
          try {
            const seo = JSON.parse(p.seo_json || "{}");
            const schema = JSON.parse(p.schema_json || "[]");
            all.push({ slug: p.slug, url: p.url, seo, hasSchema: schema.length > 0 });
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
        <div><h2 className="text-2xl font-bold text-gray-900">SEO Library</h2><p className="mt-1 text-sm text-gray-600">{items.length} products | {items.filter(i => i.seo.title).length} with SEO</p></div>
        <Link href="/dashboard/detail-extraction" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">Back</Link>
      </div>
      {items.length > 0 ? (
        <div className="overflow-x-auto rounded-xl bg-white shadow">
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 font-medium text-gray-500">Product</th>
              <th className="px-4 py-3 font-medium text-gray-500">Title</th>
              <th className="px-4 py-3 font-medium text-gray-500">Meta Desc</th>
              <th className="px-4 py-3 font-medium text-gray-500">OG Image</th>
              <th className="px-4 py-3 font-medium text-gray-500">Schema</th>
            </tr></thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="max-w-xs px-4 py-3"><div className="font-medium text-gray-900">{item.slug}</div></td>
                  <td className="max-w-xs truncate px-4 py-3 text-sm text-gray-600">{item.seo.title || <span className="text-red-400">Missing</span>}</td>
                  <td className="max-w-xs truncate px-4 py-3 text-sm text-gray-600">{item.seo.metaDescription || <span className="text-red-400">Missing</span>}</td>
                  <td className="px-4 py-3">{item.seo.ogImage ? <span className="text-green-600">Yes</span> : <span className="text-gray-400">No</span>}</td>
                  <td className="px-4 py-3">{item.hasSchema ? <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-bold text-green-700">Yes</span> : <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-bold text-red-700">No</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl bg-white p-12 text-center shadow"><p className="text-gray-600">No SEO data found.</p></div>
      )}
    </div>
  );
}
