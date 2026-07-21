"use client";

import { useEffect, useState } from "react";

type SearchEntry = {
  id: number;
  entity_type: string;
  entity_id: number;
  title: string;
  description: string;
  keywords: string;
  url: string;
  image_url: string;
  category: string;
};

export default function CmsSearchPage() {
  const [entries, setEntries] = useState<SearchEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/cms-generator", { cache: "no-store" });
        const json = await res.json();
        setEntries(json.searchIndex || []);
      } catch { console.error("Failed to load search index"); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const byType = entries.reduce((acc, e) => {
    acc[e.entity_type] = (acc[e.entity_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const filtered = searchTerm
    ? entries.filter(e =>
        e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.keywords.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : entries;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent mx-auto" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">CMS Search Index</h2>
        <p className="mt-1 text-gray-600">{entries.length} indexed entries</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search the index..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 w-64"
        />
        {Object.entries(byType).map(([type, count]) => (
          <span key={type} className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-medium text-cyan-700">
            {type}: {count}
          </span>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 font-medium text-gray-500">Title</th>
              <th className="px-4 py-3 font-medium text-gray-500">Type</th>
              <th className="px-4 py-3 font-medium text-gray-500">Category</th>
              <th className="px-4 py-3 font-medium text-gray-500">Keywords</th>
              <th className="px-4 py-3 font-medium text-gray-500">URL</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 200).map(entry => (
              <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">{entry.title}</td>
                <td className="px-4 py-3"><span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">{entry.entity_type}</span></td>
                <td className="px-4 py-3 text-gray-600">{entry.category || "-"}</td>
                <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">{entry.keywords || "-"}</td>
                <td className="px-4 py-3 text-gray-500 text-xs font-mono truncate max-w-xs">{entry.url}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
