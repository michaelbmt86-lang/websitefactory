"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type DownloadItem = { url: string; title: string; type: string; size: string | null; productSlug: string };

export default function DownloadsPage() {
  const [items, setItems] = useState<DownloadItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/detail-extraction", { cache: "no-store" })
      .then(r => r.json())
      .then(d => {
        const all: DownloadItem[] = [];
        for (const p of d.products || []) {
          try {
            const downloads = JSON.parse(p.downloads_json || "[]");
            for (const dl of downloads) all.push({ ...dl, productSlug: p.slug });
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
        <div><h2 className="text-2xl font-bold text-gray-900">Downloads</h2><p className="mt-1 text-sm text-gray-600">{items.length} files</p></div>
        <Link href="/dashboard/detail-extraction" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">Back</Link>
      </div>
      {items.length > 0 ? (
        <div className="overflow-x-auto rounded-xl bg-white shadow">
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 font-medium text-gray-500">Product</th>
              <th className="px-4 py-3 font-medium text-gray-500">Title</th>
              <th className="px-4 py-3 font-medium text-gray-500">Type</th>
              <th className="px-4 py-3 font-medium text-gray-500">URL</th>
            </tr></thead>
            <tbody>
              {items.map((dl, i) => (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{dl.productSlug}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{dl.title}</td>
                  <td className="px-4 py-3"><span className="rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-700">{dl.type}</span></td>
                  <td className="max-w-xs truncate px-4 py-3 font-mono text-xs text-gray-500">{dl.url}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl bg-white p-12 text-center shadow"><p className="text-gray-600">No downloads found.</p></div>
      )}
    </div>
  );
}
