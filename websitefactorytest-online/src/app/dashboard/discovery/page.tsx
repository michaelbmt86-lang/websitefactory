"use client";

import { useEffect, useState } from "react";

type DiscoveryData = {
  totalUrls: number;
  maxDepth: number;
  urlsByType: Record<string, number>;
  urlsByStatus: Record<string, number>;
  depthStats: Record<string, number>;
  brokenUrls: { url: string; statusCode: number | null; parentUrl: string | null }[];
  urls: {
    id: number;
    url: string;
    slug: string;
    depth: number;
    page_type: string;
    status: string;
    priority: number;
    title: string;
    discovered_by: string;
    status_code: number | null;
  }[];
};

export default function DiscoveryDashboard() {
  const [data, setData] = useState<DiscoveryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const [siteUrl, setSiteUrl] = useState("");
  const [maxDepth, setMaxDepth] = useState(5);
  const [maxPages, setMaxPages] = useState(500);
  const [error, setError] = useState<string | null>(null);

  const loadDiscovery = async () => {
    try {
      const res = await fetch("/api/discovery", { cache: "no-store" });
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to load discovery data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDiscovery();
  }, []);

  const runDiscovery = async () => {
    if (!siteUrl) return;
    setDiscovering(true);
    setError(null);
    try {
      const res = await fetch("/api/discovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: siteUrl, maxDepth, maxPages }),
      });
      const json = await res.json();
      if (json.error) {
        setError(json.error);
      } else {
        await loadDiscovery();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Discovery failed");
    } finally {
      setDiscovering(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto" />
          <p className="text-gray-600">Loading discovery data...</p>
        </div>
      </div>
    );
  }

  const totalUrls = data?.totalUrls ?? 0;
  const categories = data?.urlsByType?.["Category"] ?? 0;
  const products = data?.urlsByType?.["Product Detail"] ?? 0;
  const productListing = data?.urlsByType?.["Product Listing"] ?? 0;
  const blogPages = (data?.urlsByType?.["Blog"] ?? 0) + (data?.urlsByType?.["Article"] ?? 0);
  const staticPages = (data?.urlsByType?.["Landing"] ?? 0) + (data?.urlsByType?.["Contact"] ?? 0) + (data?.urlsByType?.["Policy"] ?? 0);
  const brokenUrls = data?.brokenUrls?.length ?? 0;
  const crawledUrls = data?.urlsByStatus?.["crawled"] ?? 0;
  const coverage = totalUrls > 0 ? Math.round((crawledUrls / totalUrls) * 100) : 0;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Site Discovery Engine</h2>
        <p className="mt-1 text-gray-600">
          Discover, crawl, and classify all pages on any website.
        </p>
      </div>

      {/* Discovery Form */}
      <div className="mb-8 rounded-xl bg-white p-6 shadow">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Run Discovery</h3>
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-gray-700">Target URL</label>
            <input
              type="url"
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div className="w-32">
            <label className="mb-1 block text-sm font-medium text-gray-700">Max Depth</label>
            <input
              type="number"
              value={maxDepth}
              onChange={(e) => setMaxDepth(parseInt(e.target.value) || 5)}
              min={1}
              max={10}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div className="w-32">
            <label className="mb-1 block text-sm font-medium text-gray-700">Max Pages</label>
            <input
              type="number"
              value={maxPages}
              onChange={(e) => setMaxPages(parseInt(e.target.value) || 500)}
              min={10}
              max={5000}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <button
            onClick={runDiscovery}
            disabled={discovering || !siteUrl}
            className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {discovering ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Discovering...
              </span>
            ) : (
              "Start Discovery"
            )}
          </button>
        </div>
        {error && (
          <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total URLs" value={totalUrls} icon="🔗" color="blue" />
        <StatCard title="Categories" value={categories} icon="📁" color="green" />
        <StatCard title="Products" value={products + productListing} icon="📦" color="purple" />
        <StatCard title="Blog Pages" value={blogPages} icon="📝" color="orange" />
      </div>

      <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Static Pages" value={staticPages} icon="📄" color="slate" />
        <StatCard title="Broken URLs" value={brokenUrls} icon="⚠️" color="red" />
        <StatCard title="Max Depth" value={data?.maxDepth ?? 0} icon="🌳" color="teal" />
        <StatCard title="Coverage" value={`${coverage}%`} icon="📊" color="cyan" />
      </div>

      {/* Page Type Breakdown */}
      {data && Object.keys(data.urlsByType).length > 0 && (
        <div className="mb-8 rounded-xl bg-white p-6 shadow">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Page Types</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(data.urlsByType)
              .sort(([, a], [, b]) => b - a)
              .map(([type, count]) => (
                <div key={type} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                  <span className="text-sm font-medium text-gray-700">{type}</span>
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-bold text-blue-700">{count}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Depth Distribution */}
      {data && Object.keys(data.depthStats).length > 0 && (
        <div className="mb-8 rounded-xl bg-white p-6 shadow">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Depth Distribution</h3>
          <div className="flex items-end gap-3">
            {Object.entries(data.depthStats)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([depth, count]) => {
                const maxCount = Math.max(...Object.values(data.depthStats));
                const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
                return (
                  <div key={depth} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-xs font-bold text-gray-700">{count}</span>
                    <div
                      className="w-full rounded-t bg-blue-500"
                      style={{ height: `${Math.max(height, 4)}%`, minHeight: "8px" }}
                    />
                    <span className="text-xs text-gray-500">D{depth}</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Broken URLs */}
      {data && data.brokenUrls.length > 0 && (
        <div className="mb-8 rounded-xl bg-white p-6 shadow">
          <h3 className="mb-4 text-lg font-semibold text-red-600">Broken URLs ({data.brokenUrls.length})</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="pb-3 font-medium text-gray-500">URL</th>
                  <th className="pb-3 font-medium text-gray-500">Status</th>
                  <th className="pb-3 font-medium text-gray-500">Parent</th>
                </tr>
              </thead>
              <tbody>
                {data.brokenUrls.slice(0, 20).map((item, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="max-w-md truncate py-3 font-mono text-xs text-gray-900">{item.url}</td>
                    <td className="py-3">
                      <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-bold text-red-700">
                        {item.statusCode ?? "N/A"}
                      </span>
                    </td>
                    <td className="max-w-xs truncate py-3 font-mono text-xs text-gray-500">{item.parentUrl ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Discovered URLs */}
      {data && data.urls.length > 0 && (
        <div className="rounded-xl bg-white p-6 shadow">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Discovered URLs ({totalUrls})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="pb-3 font-medium text-gray-500">URL</th>
                  <th className="pb-3 font-medium text-gray-500">Type</th>
                  <th className="pb-3 font-medium text-gray-500">Depth</th>
                  <th className="pb-3 font-medium text-gray-500">Status</th>
                  <th className="pb-3 font-medium text-gray-500">Priority</th>
                  <th className="pb-3 font-medium text-gray-500">Source</th>
                </tr>
              </thead>
              <tbody>
                {data.urls.slice(0, 30).map((item) => (
                  <tr key={item.id} className="border-b border-gray-100">
                    <td className="max-w-md truncate py-3">
                      <span className="font-medium text-gray-900">{item.title || item.slug || item.url}</span>
                      <span className="ml-2 block truncate font-mono text-xs text-gray-500">{item.url}</span>
                    </td>
                    <td className="py-3">
                      <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                        {item.page_type}
                      </span>
                    </td>
                    <td className="py-3 text-gray-600">{item.depth}</td>
                    <td className="py-3">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="py-3 text-gray-600">{item.priority}</td>
                    <td className="py-3 text-xs text-gray-500">{item.discovered_by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {totalUrls === 0 && !loading && (
        <div className="rounded-xl bg-white p-12 text-center shadow">
          <div className="mb-4 text-5xl">🔍</div>
          <h3 className="mb-2 text-xl font-semibold text-gray-900">No URLs Discovered Yet</h3>
          <p className="text-gray-600">Enter a website URL above to start the discovery process.</p>
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: string;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    green: "bg-green-50 text-green-600",
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
    red: "bg-red-50 text-red-600",
    slate: "bg-slate-50 text-slate-600",
    teal: "bg-teal-50 text-teal-600",
    cyan: "bg-cyan-50 text-cyan-600",
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow transition hover:shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`rounded-lg p-3 ${colorClasses[color] ?? "bg-gray-50 text-gray-600"}`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
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
    </span>
  );
}
