"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ProductDiscoveryData = {
  totalProducts: number;
  totalCategories: number;
  duplicatesFound: number;
  brokenProducts: number;
  coverage: number;
  productsByCategory: Record<string, number>;
  productsByStatus: Record<string, number>;
  products: {
    id: number;
    url: string;
    product_slug: string;
    product_name: string;
    category: string;
    status: string;
    priority: number;
    price: string | null;
    sku: string | null;
    is_duplicate: number;
    discovered_by: string;
    source_page: string;
  }[];
};

export default function ProductDiscoveryDashboard() {
  const [data, setData] = useState<ProductDiscoveryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const res = await fetch("/api/product-discovery", { cache: "no-store" });
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to load product discovery data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const runDiscovery = async () => {
    setDiscovering(true);
    setError(null);
    try {
      // Get the site URL from the last site discovery
      const siteRes = await fetch("/api/discovery", { cache: "no-store" });
      const siteData = await siteRes.json();
      const siteUrl = siteData.urls?.[0]?.url?.replace(/\/[^/]*$/, "") || "";

      if (!siteUrl) {
        setError("Run Site Discovery first to establish a target URL");
        setDiscovering(false);
        return;
      }

      const res = await fetch("/api/product-discovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: siteUrl }),
      });
      const json = await res.json();
      if (json.error) {
        setError(json.error);
      } else {
        await loadData();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Product discovery failed");
    } finally {
      setDiscovering(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent mx-auto" />
          <p className="text-gray-600">Loading product discovery data...</p>
        </div>
      </div>
    );
  }

  const totalProducts = data?.totalProducts ?? 0;
  const totalCategories = data?.totalCategories ?? 0;
  const duplicatesFound = data?.duplicatesFound ?? 0;
  const brokenProducts = data?.brokenProducts ?? 0;
  const coverage = data?.coverage ?? 0;
  const crawledProducts = data?.productsByStatus?.["crawled"] ?? 0;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Product Discovery Engine</h2>
        <p className="mt-1 text-gray-600">
          Discover, crawl, and classify all products from listing pages.
        </p>
      </div>

      {/* Run Button */}
      <div className="mb-8 rounded-xl bg-white p-6 shadow">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Run Product Discovery</h3>
            <p className="mt-1 text-sm text-gray-600">
              Uses Site Discovery output. Run Site Discovery first, then discover products from listing pages.
            </p>
          </div>
          <button
            onClick={runDiscovery}
            disabled={discovering}
            className="rounded-lg bg-purple-600 px-6 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {discovering ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Discovering Products...
              </span>
            ) : (
              "Start Product Discovery"
            )}
          </button>
        </div>
        {error && (
          <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Products" value={totalProducts} icon="📦" color="purple" />
        <StatCard title="Categories" value={totalCategories} icon="📁" color="blue" />
        <StatCard title="Duplicates" value={duplicatesFound} icon="🔄" color="orange" />
        <StatCard title="Broken URLs" value={brokenProducts} icon="⚠️" color="red" />
      </div>

      <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Crawled" value={crawledProducts} icon="✅" color="green" />
        <StatCard title="Coverage" value={`${coverage}%`} icon="📊" color="teal" />
        <StatCard
          title="Progress"
          value={totalProducts > 0 ? `${Math.round((crawledProducts / Math.max(totalProducts + duplicatesFound, 1)) * 100)}%` : "0%"}
          icon="⏳"
          color="cyan"
        />
        <StatCard title="Discovered" value={data?.products?.length ?? 0} icon="🔍" color="slate" />
      </div>

      {/* Category Breakdown */}
      {data && Object.keys(data.productsByCategory).length > 0 && (
        <div className="mb-8 rounded-xl bg-white p-6 shadow">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Products by Category</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(data.productsByCategory)
              .sort(([, a], [, b]) => b - a)
              .map(([category, count]) => (
                <div key={category} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                  <span className="text-sm font-medium text-gray-700">{category}</span>
                  <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-bold text-purple-700">{count}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Status Breakdown */}
      {data && Object.keys(data.productsByStatus).length > 0 && (
        <div className="mb-8 rounded-xl bg-white p-6 shadow">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Status Breakdown</h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(data.productsByStatus).map(([status, count]) => (
              <StatusPill key={status} status={status} count={count} />
            ))}
          </div>
        </div>
      )}

      {/* Recent Products */}
      {data && data.products.length > 0 && (
        <div className="rounded-xl bg-white p-6 shadow">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Discovered Products ({totalProducts})
            </h3>
            <Link
              href="/dashboard/product-discovery/products"
              className="text-sm font-medium text-purple-600 hover:text-purple-700"
            >
              View All →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="pb-3 font-medium text-gray-500">Product</th>
                  <th className="pb-3 font-medium text-gray-500">Category</th>
                  <th className="pb-3 font-medium text-gray-500">Status</th>
                  <th className="pb-3 font-medium text-gray-500">Price</th>
                  <th className="pb-3 font-medium text-gray-500">Source</th>
                </tr>
              </thead>
              <tbody>
                {data.products.slice(0, 20).map((item) => (
                  <tr key={item.id} className="border-b border-gray-100">
                    <td className="max-w-sm py-3">
                      <span className="font-medium text-gray-900">{item.product_name || item.product_slug}</span>
                      <span className="ml-2 block truncate font-mono text-xs text-gray-500">{item.url}</span>
                    </td>
                    <td className="py-3">
                      <span className="rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3">
                      <StatusBadge status={item.status} isDuplicate={item.is_duplicate === 1} />
                    </td>
                    <td className="py-3 text-sm text-gray-600">{item.price ?? "-"}</td>
                    <td className="py-3 text-xs text-gray-500">{item.discovered_by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {totalProducts === 0 && !loading && (
        <div className="rounded-xl bg-white p-12 text-center shadow">
          <div className="mb-4 text-5xl">🛒</div>
          <h3 className="mb-2 text-xl font-semibold text-gray-900">No Products Discovered Yet</h3>
          <p className="text-gray-600">Run Site Discovery first, then start Product Discovery.</p>
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

function StatusPill({ status, count }: { status: string; count: number }) {
  const styles: Record<string, string> = {
    crawled: "bg-green-100 text-green-700 border-green-200",
    discovered: "bg-yellow-100 text-yellow-700 border-yellow-200",
    broken: "bg-red-100 text-red-700 border-red-200",
    failed: "bg-red-100 text-red-700 border-red-200",
    duplicate: "bg-orange-100 text-orange-700 border-orange-200",
  };

  return (
    <div className={`rounded-full border px-4 py-2 text-sm font-bold ${styles[status] ?? "bg-gray-100 text-gray-700 border-gray-200"}`}>
      {status}: {count}
    </div>
  );
}
