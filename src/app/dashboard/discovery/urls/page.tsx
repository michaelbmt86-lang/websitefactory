"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type DiscoveredUrl = {
  id: number;
  url: string;
  slug: string;
  depth: number;
  parent_url: string | null;
  page_type: string;
  status: string;
  priority: number;
  discovered_by: string;
  title: string;
  meta_description: string;
  h1: string;
  internal_links: number;
  external_links: number;
  images: number;
  status_code: number | null;
  response_time_ms: number | null;
  created_at: string;
};

type FilterType = "all" | string;

export default function DiscoveredUrlsPage() {
  const [urls, setUrls] = useState<DiscoveredUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [pageTypes, setPageTypes] = useState<string[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/discovery", { cache: "no-store" });
        const data = await res.json();
        setUrls(data.urls || []);
        setPageTypes(Object.keys(data.urlsByType || {}).sort());
      } catch (err) {
        console.error("Failed to load URLs:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = urls.filter((u) => {
    if (filter !== "all" && u.page_type !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        u.url.toLowerCase().includes(q) ||
        u.title.toLowerCase().includes(q) ||
        u.slug.toLowerCase().includes(q) ||
        u.h1.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Discovered URLs</h2>
          <p className="mt-1 text-sm text-gray-600">{filtered.length} URLs shown</p>
        </div>
        <Link
          href="/dashboard/discovery"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Back to Discovery
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search URLs..."
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        >
          <option value="all">All Types ({urls.length})</option>
          {pageTypes.map((pt) => (
            <option key={pt} value={pt}>
              {pt} ({urls.filter((u) => u.page_type === pt).length})
            </option>
          ))}
        </select>
      </div>

      {/* URL Table */}
      {filtered.length > 0 ? (
        <div className="overflow-x-auto rounded-xl bg-white shadow">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 font-medium text-gray-500">Title / URL</th>
                <th className="px-4 py-3 font-medium text-gray-500">Type</th>
                <th className="px-4 py-3 font-medium text-gray-500">Depth</th>
                <th className="px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 font-medium text-gray-500">Priority</th>
                <th className="px-4 py-3 font-medium text-gray-500">Links</th>
                <th className="px-4 py-3 font-medium text-gray-500">Source</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="max-w-sm px-4 py-3">
                    <div className="font-medium text-gray-900">{item.title || item.h1 || item.slug}</div>
                    <div className="truncate font-mono text-xs text-gray-500">{item.url}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                      {item.page_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{item.depth}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={item.status} code={item.status_code} />
                  </td>
                  <td className="px-4 py-3 text-gray-600">{item.priority}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {item.internal_links} int / {item.external_links} ext
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{item.discovered_by}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl bg-white p-12 text-center shadow">
          <p className="text-gray-600">
            {search || filter !== "all" ? "No URLs match your filters." : "No URLs discovered yet."}
          </p>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status, code }: { status: string; code: number | null }) {
  const styles: Record<string, string> = {
    crawled: "bg-green-100 text-green-700",
    discovered: "bg-yellow-100 text-yellow-700",
    broken: "bg-red-100 text-red-700",
    failed: "bg-red-100 text-red-700",
    skipped: "bg-gray-100 text-gray-700",
  };

  return (
    <span className={`rounded-full px-2 py-1 text-xs font-bold ${styles[status] ?? "bg-gray-100 text-gray-700"}`}>
      {status}
      {code ? ` (${code})` : ""}
    </span>
  );
}
