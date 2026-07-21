"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type MediaItem = { id: number; productSlug: string; type: string; url: string; alt: string; width: number | null; height: number | null; hash: string };

export default function MediaLibraryPage() {
  const [assets, setAssets] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("/api/detail-extraction", { cache: "no-store" })
      .then(r => r.json())
      .then(d => {
        const items: MediaItem[] = [];
        for (const p of d.products || []) {
          const images = (() => { try { return JSON.parse(p.images_json || "[]"); } catch { return []; } })();
          const downloads = (() => { try { return JSON.parse(p.downloads_json || "[]"); } catch { return []; } })();
          for (const img of images) items.push({ id: 0, productSlug: p.slug, type: "image", url: img.url || img, alt: img.alt || "", width: img.width || null, height: img.height || null, hash: "" });
          for (const dl of downloads) items.push({ id: 0, productSlug: p.slug, type: "download", url: dl.url || dl, alt: dl.title || "", width: null, height: null, hash: "" });
        }
        setAssets(items);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? assets : assets.filter(a => a.type === filter);
  const counts = { image: assets.filter(a => a.type === "image").length, download: assets.filter(a => a.type === "download").length };

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" /></div>;

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-gray-900">Media Library</h2><p className="mt-1 text-sm text-gray-600">{assets.length} assets total</p></div>
        <Link href="/dashboard/detail-extraction" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">Back</Link>
      </div>
      <div className="mb-6 flex gap-2">
        {(["all", "image", "download"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-4 py-2 text-sm font-medium ${filter === f ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
            {f === "all" ? `All (${assets.length})` : f === "image" ? `Images (${counts.image})` : `Downloads (${counts.download})`}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto rounded-xl bg-white shadow">
        <table className="w-full text-left text-sm">
          <thead><tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-4 py-3 font-medium text-gray-500">Type</th>
            <th className="px-4 py-3 font-medium text-gray-500">Product</th>
            <th className="px-4 py-3 font-medium text-gray-500">URL</th>
            <th className="px-4 py-3 font-medium text-gray-500">Alt</th>
          </tr></thead>
          <tbody>
            {filtered.map((a, i) => (
              <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3"><span className="rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700">{a.type}</span></td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{a.productSlug}</td>
                <td className="max-w-xs truncate px-4 py-3 font-mono text-xs text-gray-500">{a.url}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{a.alt || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
