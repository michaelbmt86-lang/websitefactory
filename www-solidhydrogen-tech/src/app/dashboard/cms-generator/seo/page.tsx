"use client";

import { useEffect, useState } from "react";

type SeoEntry = {
  id: number;
  url: string;
  slug: string;
  page_type: string;
  entity_type: string;
  meta_title: string;
  meta_description: string;
  og_title: string;
  og_description: string;
  og_image: string;
  canonical: string;
};

export default function CmsSeoPage() {
  const [entries, setEntries] = useState<SeoEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/cms-generator", { cache: "no-store" });
        const json = await res.json();
        setEntries(json.seoPages || []);
      } catch { console.error("Failed to load SEO data"); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const withMeta = entries.filter(e => e.meta_title && e.meta_description).length;
  const withOg = entries.filter(e => e.og_title && e.og_description).length;
  const coverage = entries.length > 0 ? Math.round((withMeta / entries.length) * 100) : 0;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-t-transparent mx-auto" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">CMS SEO Metadata</h2>
        <p className="mt-1 text-gray-600">{entries.length} SEO entries — {coverage}% coverage</p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">Total Entries</p>
          <p className="text-2xl font-bold text-gray-900">{entries.length}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">With Meta Tags</p>
          <p className="text-2xl font-bold text-green-600">{withMeta}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">With OG Tags</p>
          <p className="text-2xl font-bold text-blue-600">{withOg}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 font-medium text-gray-500">Page</th>
              <th className="px-4 py-3 font-medium text-gray-500">Type</th>
              <th className="px-4 py-3 font-medium text-gray-500">Meta Title</th>
              <th className="px-4 py-3 font-medium text-gray-500">Meta Desc</th>
              <th className="px-4 py-3 font-medium text-gray-500">OG</th>
            </tr>
          </thead>
          <tbody>
            {entries.slice(0, 200).map(entry => (
              <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">{entry.slug}</td>
                <td className="px-4 py-3"><span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">{entry.page_type}</span></td>
                <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{entry.meta_title || <span className="text-red-400">Missing</span>}</td>
                <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{entry.meta_description ? "✓" : <span className="text-red-400">Missing</span>}</td>
                <td className="px-4 py-3">{entry.og_title ? <span className="text-green-600">✓</span> : <span className="text-red-400">✗</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
