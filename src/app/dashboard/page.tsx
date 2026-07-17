"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type DashboardData = {
  settings: { site_name: string } | null;
  products: { id: number; name: string; price: number }[];
  categories: { id: number; name: string }[];
  pages: { id: number; title: string }[];
  media: { id: number; filename: string }[];
  navigation: { id: number; label: string }[];
  discovery: {
    totalUrls: number;
    urlsByType: Record<string, number>;
    urlsByStatus: Record<string, number>;
    brokenUrls: { url: string; statusCode: number | null }[];
  } | null;
  productDiscovery: {
    totalProducts: number;
    totalCategories: number;
    duplicatesFound: number;
    brokenProducts: number;
    productsByCategory: Record<string, number>;
  } | null;
  detailExtraction: {
    totalProducts: number;
    completed: number;
    failed: number;
    coverage: number;
    totalImages: number;
    productsWithSEO: number;
    productsWithSchema: number;
  } | null;
  cmsGenerator: {
    totalPages: number;
    totalBrands: number;
    totalCollections: number;
    totalBlogPosts: number;
    totalSeo: number;
    totalSearch: number;
    quality: {
      issues: number;
      missingMetadata: number;
      brokenLinks: number;
    };
  } | null;
};

export default function DashboardHome() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [settingsRes, productsRes, categoriesRes, pagesRes, mediaRes, navRes, discoveryRes, productDiscoveryRes, detailExtractionRes, cmsGeneratorRes] = await Promise.all([
          fetch("/api/settings", { cache: "no-store" }),
          fetch("/api/products", { cache: "no-store" }),
          fetch("/api/categories", { cache: "no-store" }),
          fetch("/api/pages", { cache: "no-store" }),
          fetch("/api/media", { cache: "no-store" }),
          fetch("/api/navigation", { cache: "no-store" }),
          fetch("/api/discovery", { cache: "no-store" }),
          fetch("/api/product-discovery", { cache: "no-store" }),
          fetch("/api/detail-extraction", { cache: "no-store" }),
          fetch("/api/cms-generator", { cache: "no-store" }),
        ]);

        const settings = await settingsRes.json();
        const products = await productsRes.json();
        const categories = await categoriesRes.json();
        const pages = await pagesRes.json();
        const media = await mediaRes.json();
        const navigation = await navRes.json();
        const discovery = await discoveryRes.json();
        const productDiscovery = await productDiscoveryRes.json();
        const detailExtraction = await detailExtractionRes.json();
        const cmsGenerator = await cmsGeneratorRes.json();

        setData({ settings, products, categories, pages, media, navigation, discovery, productDiscovery, detailExtraction, cmsGenerator });
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-t-transparent mx-auto"></div>
          <p className="text-lg text-gray-600">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <p className="text-lg text-red-600">Failed to load dashboard data.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-slate-900 text-white">
        <div className="border-b border-slate-700 p-6">
          <h1 className="text-xl font-bold">{data.settings?.site_name ?? "BioPak"} CMS</h1>
        </div>
        <nav className="space-y-0.5 p-4">
          <p className="mb-2 px-3 text-xs font-bold uppercase tracking-wider text-slate-400">Content</p>
          <NavLink href="/dashboard" label="Dashboard" icon="📊" />
          <NavLink href="/dashboard/products" label="Products" icon="📦" />
          <NavLink href="/dashboard/categories" label="Categories" icon="📁" />
          <NavLink href="/dashboard/pages" label="Pages" icon="📄" />
          <NavLink href="/dashboard/navigation" label="Navigation" icon="🧭" />
          <NavLink href="/dashboard/media" label="Media" icon="🖼️" />
          <p className="mb-2 mt-4 px-3 text-xs font-bold uppercase tracking-wider text-slate-400">Discovery</p>
          <NavLink href="/dashboard/discovery" label="Site Discovery" icon="🔍" />
          <NavLink href="/dashboard/discovery/urls" label="Discovered URLs" icon="🔗" />
          <NavLink href="/dashboard/product-discovery" label="Product Discovery" icon="🛒" />
          <NavLink href="/dashboard/product-discovery/products" label="Product URLs" icon="📦" />
          <p className="mb-2 mt-4 px-3 text-xs font-bold uppercase tracking-wider text-slate-400">Detail Extraction</p>
          <NavLink href="/dashboard/detail-extraction" label="Extraction Overview" icon="🔍" />
          <NavLink href="/dashboard/detail-extraction/products" label="Extracted Products" icon="📦" />
          <NavLink href="/dashboard/detail-extraction/images" label="Images" icon="🖼️" />
          <NavLink href="/dashboard/detail-extraction/seo" label="SEO" icon="📋" />
          <NavLink href="/dashboard/detail-extraction/schema" label="Schema" icon="📐" />
          <p className="mb-2 mt-4 px-3 text-xs font-bold uppercase tracking-wider text-slate-400">CMS Generator</p>
          <NavLink href="/dashboard/cms-generator" label="Overview" icon="🏗️" />
          <NavLink href="/dashboard/cms-generator/pages" label="Pages" icon="📄" />
          <NavLink href="/dashboard/cms-generator/brands" label="Brands" icon="🏷️" />
          <NavLink href="/dashboard/cms-generator/collections" label="Collections" icon="📁" />
          <NavLink href="/dashboard/cms-generator/seo" label="SEO" icon="🔍" />
          <p className="mb-2 mt-4 px-3 text-xs font-bold uppercase tracking-wider text-slate-400">Settings</p>
          <NavLink href="/dashboard/settings" label="General" icon="⚙️" />
          <NavLink href="/dashboard/seo" label="SEO" icon="🔍" />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
          <p className="mt-1 text-gray-600">
            Welcome to the {data.settings?.site_name ?? "BioPak"} content management system.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Products"
            value={data.products.length}
            icon="📦"
            href="/dashboard/products"
            color="green"
          />
          <StatCard
            title="Categories"
            value={data.categories.length}
            icon="📁"
            href="/dashboard/categories"
            color="blue"
          />
          <StatCard
            title="Pages"
            value={data.pages.length}
            icon="📄"
            href="/dashboard/pages"
            color="purple"
          />
          <StatCard
            title="Media Files"
            value={data.media.length}
            icon="🖼️"
            href="/dashboard/media"
            color="orange"
          />
        </div>

        {/* Discovery Stats */}
        {data.discovery && (
          <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Discovered URLs"
              value={data.discovery.totalUrls}
              icon="🔗"
              href="/dashboard/discovery"
              color="blue"
            />
            <StatCard
              title="Site Categories"
              value={data.discovery.urlsByType?.["Category"] ?? 0}
              icon="📂"
              href="/dashboard/discovery"
              color="teal"
            />
            <StatCard
              title="Site Products"
              value={(data.discovery.urlsByType?.["Product Detail"] ?? 0) + (data.discovery.urlsByType?.["Product Listing"] ?? 0)}
              icon="🛍️"
              href="/dashboard/discovery"
              color="purple"
            />
            <StatCard
              title="Broken URLs"
              value={data.discovery.brokenUrls?.length ?? 0}
              icon="⚠️"
              href="/dashboard/discovery"
              color="red"
            />
          </div>
        )}

        {/* Product Discovery Stats */}
        {data.productDiscovery && (
          <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Products Found"
              value={data.productDiscovery.totalProducts}
              icon="📦"
              href="/dashboard/product-discovery"
              color="purple"
            />
            <StatCard
              title="Product Categories"
              value={data.productDiscovery.totalCategories}
              icon="📁"
              href="/dashboard/product-discovery"
              color="blue"
            />
            <StatCard
              title="Duplicate Products"
              value={data.productDiscovery.duplicatesFound}
              icon="🔄"
              href="/dashboard/product-discovery"
              color="orange"
            />
            <StatCard
              title="Broken Products"
              value={data.productDiscovery.brokenProducts}
              icon="⚠️"
              href="/dashboard/product-discovery"
              color="red"
            />
          </div>
        )}

        {/* Detail Extraction Stats */}
        {data.detailExtraction && (
          <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Extracted Products"
              value={data.detailExtraction.completed}
              icon="🔍"
              href="/dashboard/detail-extraction"
              color="indigo"
            />
            <StatCard
              title="Product Images"
              value={data.detailExtraction.totalImages}
              icon="🖼️"
              href="/dashboard/detail-extraction/images"
              color="purple"
            />
            <StatCard
              title="SEO Coverage"
              value={`${data.detailExtraction.productsWithSEO}%`}
              icon="📋"
              href="/dashboard/detail-extraction/seo"
              color="green"
            />
            <StatCard
              title="Schema Coverage"
              value={`${data.detailExtraction.productsWithSchema}%`}
              icon="📐"
              href="/dashboard/detail-extraction/schema"
              color="teal"
            />
          </div>
        )}

        {/* CMS Generator Stats */}
        {data.cmsGenerator && data.cmsGenerator.totalPages > 0 && (
          <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="CMS Pages"
              value={data.cmsGenerator.totalPages}
              icon="📄"
              href="/dashboard/cms-generator"
              color="emerald"
            />
            <StatCard
              title="CMS Brands"
              value={data.cmsGenerator.totalBrands}
              icon="🏷️"
              href="/dashboard/cms-generator/brands"
              color="purple"
            />
            <StatCard
              title="CMS Collections"
              value={data.cmsGenerator.totalCollections}
              icon="📁"
              href="/dashboard/cms-generator/collections"
              color="teal"
            />
            <StatCard
              title="Quality Issues"
              value={data.cmsGenerator.quality.issues}
              icon="⚠️"
              href="/dashboard/cms-generator/quality"
              color="red"
            />
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Quick Actions</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ActionCard
              title="Add New Product"
              description="Create a new product listing"
              href="/dashboard/products/new"
              icon="➕"
            />
            <ActionCard
              title="Manage Categories"
              description="Organize your product categories"
              href="/dashboard/categories"
              icon="📂"
            />
            <ActionCard
              title="Upload Media"
              description="Add images and files"
              href="/dashboard/media"
              icon="📤"
            />
            <ActionCard
              title="Edit Navigation"
              description="Update menu structure"
              href="/dashboard/navigation"
              icon="🔗"
            />
            <ActionCard
              title="Site Settings"
              description="Configure general settings"
              href="/dashboard/settings"
              icon="⚙️"
            />
            <ActionCard
              title="SEO Settings"
              description="Optimize for search engines"
              href="/dashboard/seo"
              icon="🔍"
            />
          </div>
        </div>

        {/* Recent Products */}
        {data.products.length > 0 && (
          <div className="rounded-xl bg-white p-6 shadow">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Products</h3>
              <Link
                href="/dashboard/products"
                className="text-sm font-medium text-green-600 hover:text-green-700"
              >
                View All →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="pb-3 font-medium text-gray-500">Name</th>
                    <th className="pb-3 font-medium text-gray-500">Price</th>
                    <th className="pb-3 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.products.slice(0, 5).map((product) => (
                    <tr key={product.id} className="border-b border-gray-100">
                      <td className="py-3 font-medium text-gray-900">{product.name}</td>
                      <td className="py-3 text-gray-600">${product.price.toFixed(2)}</td>
                      <td className="py-3">
                        <Link
                          href={`/dashboard/products/${product.id}`}
                          className="text-green-600 hover:text-green-700"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function NavLink({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-700 hover:text-white"
    >
      <span>{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

function StatCard({
  title,
  value,
  icon,
  href,
  color,
}: {
  title: string;
  value: string | number;
  icon: string;
  href: string;
  color: "green" | "blue" | "purple" | "orange" | "teal" | "red" | "indigo" | "cyan" | "slate" | "emerald";
}) {
  const colorClasses = {
    green: "bg-green-50 text-green-600",
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
    teal: "bg-teal-50 text-teal-600",
    red: "bg-red-50 text-red-600",
    indigo: "bg-indigo-50 text-indigo-600",
    cyan: "bg-cyan-50 text-cyan-600",
    slate: "bg-slate-50 text-slate-600",
    emerald: "bg-emerald-50 text-emerald-600",
  };

  return (
    <Link
      href={href}
      className="rounded-xl bg-white p-6 shadow transition hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`rounded-lg p-3 ${colorClasses[color]}`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </Link>
  );
}

function ActionCard({
  title,
  description,
  href,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md"
    >
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
