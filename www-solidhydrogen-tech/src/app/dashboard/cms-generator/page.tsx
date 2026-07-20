"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type CmsData = {
  totalPages: number;
  publishedPages: number;
  totalBrands: number;
  totalCollections: number;
  totalBlogPosts: number;
  totalProductPages: number;
  totalSeo: number;
  totalSearch: number;
  quality: {
    issues: number;
    missingMetadata: number;
    missingSeo: number;
    brokenLinks: number;
    duplicateSlugs: number;
    emptyDescriptions: number;
  };
};

export default function CmsGeneratorDashboard() {
  const [data, setData] = useState<CmsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const res = await fetch("/api/cms-generator", { cache: "no-store" });
      const json = await res.json();
      setData(json);
    } catch {
      console.error("Failed to load CMS data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const runGeneration = async () => {
    setGenerating(true);
    setError(null);
    try {
      const siteRes = await fetch("/api/discovery", { cache: "no-store" });
      const siteData = await siteRes.json();
      const siteUrl = siteData.siteUrl || siteData.urls?.[0]?.url?.replace(/\/[^/]*$/, "") || "";
      if (!siteUrl) {
        setError("Run Site Discovery first");
        setGenerating(false);
        return;
      }
      const res = await fetch("/api/cms-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: siteUrl }),
      });
      const json = await res.json();
      if (json.error) setError(json.error);
      else await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent mx-auto" />
          <p className="text-gray-600">Loading CMS data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">CMS Generator Engine</h2>
        <p className="mt-1 text-gray-600">Generate a complete CMS from extracted product data.</p>
      </div>

      <div className="mb-8 rounded-xl bg-white p-6 shadow">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Run CMS Generation</h3>
            <p className="mt-1 text-sm text-gray-600">Uses extracted_products, site_urls, and posts as input.</p>
          </div>
          <button onClick={runGeneration} disabled={generating} className="rounded-lg bg-emerald-600 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">
            {generating ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Generating...
              </span>
            ) : "Generate CMS"}
          </button>
        </div>
        {error && <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
      </div>

      <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Pages" value={data?.totalPages ?? 0} icon="📄" color="blue" />
        <StatCard title="Brands" value={data?.totalBrands ?? 0} icon="🏷️" color="purple" />
        <StatCard title="Collections" value={data?.totalCollections ?? 0} icon="📁" color="teal" />
        <StatCard title="Blog Posts" value={data?.totalBlogPosts ?? 0} icon="📝" color="orange" />
      </div>

      <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="SEO Entries" value={data?.totalSeo ?? 0} icon="🔍" color="green" />
        <StatCard title="Search Index" value={data?.totalSearch ?? 0} icon="🔎" color="cyan" />
        <StatCard title="Product Pages" value={data?.totalProductPages ?? 0} icon="📦" color="indigo" />
        <StatCard title="Quality Issues" value={data?.quality?.issues ?? 0} icon="⚠️" color="red" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <NavCard href="/dashboard/cms-generator/pages" title="Pages" description="Manage generated CMS pages" icon="📄" />
        <NavCard href="/dashboard/cms-generator/brands" title="Brands" description="View extracted brands" icon="🏷️" />
        <NavCard href="/dashboard/cms-generator/collections" title="Collections" description="Product collections" icon="📁" />
        <NavCard href="/dashboard/cms-generator/blog" title="Blog" description="Blog post pages" icon="📝" />
        <NavCard href="/dashboard/cms-generator/seo" title="SEO" description="SEO metadata coverage" icon="🔍" />
        <NavCard href="/dashboard/cms-generator/search" title="Search Index" description="Full-text search data" icon="🔎" />
        <NavCard href="/dashboard/cms-generator/quality" title="Quality" description="Quality validation report" icon="✅" />
      </div>

      {data && data.totalPages === 0 && (
        <div className="mt-8 rounded-xl bg-white p-12 text-center shadow">
          <div className="mb-4 text-5xl">🏗️</div>
          <h3 className="mb-2 text-xl font-semibold text-gray-900">No CMS Data Yet</h3>
          <p className="text-gray-600">Run Site Discovery and Detail Extraction first, then generate the CMS.</p>
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
    indigo: "bg-indigo-50 text-indigo-600",
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
