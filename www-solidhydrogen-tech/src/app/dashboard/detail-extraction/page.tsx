"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ExtractionData = {
  totalProducts: number;
  completed: number;
  failed: number;
  pending: number;
  extracting: number;
  coverage: number;
  totalImages: number;
  totalDownloads: number;
  totalMediaAssets: number;
  productsWithSEO: number;
  productsWithSchema: number;
  productsWithSpecs: number;
  productsWithFAQ: number;
  quality: {
    issues: number;
    missingImages: number;
    missingSEO: number;
    missingSchema: number;
    brokenDownloads: number;
    duplicateProducts: number;
  };
};

export default function DetailExtractionDashboard() {
  const [data, setData] = useState<ExtractionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const res = await fetch("/api/detail-extraction", { cache: "no-store" });
      const json = await res.json();
      setData(json);
    } catch {
      console.error("Failed to load extraction data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const runExtraction = async () => {
    setExtracting(true);
    setError(null);
    try {
      const siteRes = await fetch("/api/product-discovery", { cache: "no-store" });
      const siteData = await siteRes.json();
      const siteUrl = siteData.products?.[0]?.url?.replace(/\/[^/]*$/, "") || "";
      if (!siteUrl) {
        setError("Run Product Discovery first");
        setExtracting(false);
        return;
      }
      const res = await fetch("/api/detail-extraction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: siteUrl }),
      });
      const json = await res.json();
      if (json.error) setError(json.error);
      else await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Extraction failed");
    } finally {
      setExtracting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent mx-auto" />
          <p className="text-gray-600">Loading extraction data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Detail Extraction Engine</h2>
        <p className="mt-1 text-gray-600">Extract structured CMS-ready data from every product URL.</p>
      </div>

      <div className="mb-8 rounded-xl bg-white p-6 shadow">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Run Detail Extraction</h3>
            <p className="mt-1 text-sm text-gray-600">Uses product_urls as input. Run Product Discovery first.</p>
          </div>
          <button onClick={runExtraction} disabled={extracting} className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">
            {extracting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Extracting...
              </span>
            ) : "Start Extraction"}
          </button>
        </div>
        {error && <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
      </div>

      <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Extracted" value={data?.completed ?? 0} icon="✅" color="green" />
        <StatCard title="Total Products" value={data?.totalProducts ?? 0} icon="📦" color="blue" />
        <StatCard title="Failed" value={data?.failed ?? 0} icon="❌" color="red" />
        <StatCard title="Coverage" value={`${data?.coverage ?? 0}%`} icon="📊" color="teal" />
      </div>

      <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Images" value={data?.totalImages ?? 0} icon="🖼️" color="purple" />
        <StatCard title="Downloads" value={data?.totalDownloads ?? 0} icon="📥" color="orange" />
        <StatCard title="Media Assets" value={data?.totalMediaAssets ?? 0} icon="🎬" color="cyan" />
        <StatCard title="Issues" value={data?.quality?.issues ?? 0} icon="⚠️" color="red" />
      </div>

      <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="SEO Coverage" value={`${data?.productsWithSEO ?? 0}%`} icon="🔍" color="blue" />
        <StatCard title="Schema Coverage" value={`${data?.productsWithSchema ?? 0}%`} icon="📋" color="green" />
        <StatCard title="Specs Coverage" value={`${data?.productsWithSpecs ?? 0}%`} icon="📐" color="purple" />
        <StatCard title="FAQ Coverage" value={`${data?.productsWithFAQ ?? 0}`} icon="❓" color="orange" />
      </div>

      {/* Navigation Links */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <NavCard href="/dashboard/detail-extraction/products" title="Products" description="View extracted product data" icon="📦" />
        <NavCard href="/dashboard/detail-extraction/images" title="Images" description="Browse all product images" icon="🖼️" />
        <NavCard href="/dashboard/detail-extraction/media" title="Media Library" description="All media assets" icon="🎬" />
        <NavCard href="/dashboard/detail-extraction/specifications" title="Specifications" description="Product specs data" icon="📐" />
        <NavCard href="/dashboard/detail-extraction/downloads" title="Downloads" description="PDFs and files" icon="📥" />
        <NavCard href="/dashboard/detail-extraction/seo" title="SEO" description="SEO metadata" icon="🔍" />
        <NavCard href="/dashboard/detail-extraction/schema" title="Schema" description="Structured data" icon="📋" />
        <NavCard href="/dashboard/detail-extraction/related" title="Related Products" description="Cross-sell and related" icon="🔗" />
        <NavCard href="/dashboard/detail-extraction/faq" title="FAQ" description="Frequently asked questions" icon="❓" />
      </div>

      {data && data.totalProducts === 0 && (
        <div className="rounded-xl bg-white p-12 text-center shadow">
          <div className="mb-4 text-5xl">🔍</div>
          <h3 className="mb-2 text-xl font-semibold text-gray-900">No Products Extracted Yet</h3>
          <p className="text-gray-600">Run Product Discovery first, then start Detail Extraction.</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: string | number; icon: string; color: string }) {
  const colorClasses: Record<string, string> = {
    green: "bg-green-50 text-green-600", blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600", orange: "bg-orange-50 text-orange-600",
    red: "bg-red-50 text-red-600", teal: "bg-teal-50 text-teal-600", cyan: "bg-cyan-50 text-cyan-600",
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

function NavCard({ href, title, description, icon }: { href: string; title: string; description: string; icon: string }) {
  return (
    <Link href={href} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <h4 className="font-medium text-gray-900">{title}</h4>
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        </div>
      </div>
    </Link>
  );
}
