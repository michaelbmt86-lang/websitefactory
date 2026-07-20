"use client";

import { useEffect, useState } from "react";

type Page = {
  id: number;
  url: string;
  slug: string;
  title: string;
  description: string;
  page_type: string;
  status: string;
  meta_title: string;
  meta_description: string;
};

export default function CmsPagesPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/cms-generator", { cache: "no-store" });
        const json = await res.json();
        setPages(json.pages || []);
      } catch { console.error("Failed to load pages"); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const filtered = filter === "all" ? pages : pages.filter(p => p.page_type === filter);
  const pageTypes = [...new Set(pages.map(p => p.page_type))].sort();

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">CMS Pages</h2>
        <p className="mt-1 text-gray-600">{pages.length} total pages generated</p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button onClick={() => setFilter("all")} className={`rounded-lg px-3 py-1 text-sm font-medium ${filter === "all" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>All ({pages.length})</button>
        {pageTypes.map(pt => (
          <button key={pt} onClick={() => setFilter(pt)} className={`rounded-lg px-3 py-1 text-sm font-medium ${filter === pt ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
            {pt} ({pages.filter(p => p.page_type === pt).length})
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 font-medium text-gray-500">Title</th>
              <th className="px-4 py-3 font-medium text-gray-500">Type</th>
              <th className="px-4 py-3 font-medium text-gray-500">Slug</th>
              <th className="px-4 py-3 font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 font-medium text-gray-500">SEO</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(page => (
              <tr key={page.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">{page.title}</td>
                <td className="px-4 py-3"><span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">{page.page_type}</span></td>
                <td className="px-4 py-3 text-gray-600 font-mono text-xs">{page.slug}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${page.status === "published" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {page.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {page.meta_title && page.meta_description ? (
                    <span className="text-green-600 text-xs">✓</span>
                  ) : (
                    <span className="text-red-500 text-xs">✗</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
