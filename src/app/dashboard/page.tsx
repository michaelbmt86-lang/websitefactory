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
};

export default function DashboardHome() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [settingsRes, productsRes, categoriesRes, pagesRes, mediaRes, navRes] = await Promise.all([
          fetch("/api/settings", { cache: "no-store" }),
          fetch("/api/products", { cache: "no-store" }),
          fetch("/api/categories", { cache: "no-store" }),
          fetch("/api/pages", { cache: "no-store" }),
          fetch("/api/media", { cache: "no-store" }),
          fetch("/api/navigation", { cache: "no-store" }),
        ]);

        const settings = await settingsRes.json();
        const products = await productsRes.json();
        const categories = await categoriesRes.json();
        const pages = await pagesRes.json();
        const media = await mediaRes.json();
        const navigation = await navRes.json();

        setData({ settings, products, categories, pages, media, navigation });
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
  value: number;
  icon: string;
  href: string;
  color: "green" | "blue" | "purple" | "orange";
}) {
  const colorClasses = {
    green: "bg-green-50 text-green-600",
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
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
