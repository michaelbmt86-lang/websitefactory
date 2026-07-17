// ============================================================================
// DASHBOARD LAYOUT (Website Factory Framework)
//
// Patterns:
//   - Server-side auth check via requireAuth() — redirects to /login if invalid
//   - Sidebar shell with navigation links (customizable per site)
//   - Displays authenticated username in footer
//   - Middleware handles token format validation before this runs
// ============================================================================

import { requireAuth } from "@/lib/auth";
import Link from "next/link";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-64 shrink-0 bg-slate-900 text-white">
        <div className="border-b border-slate-700 p-6">
          <h1 className="text-xl font-bold">CMS Dashboard</h1>
        </div>
        <nav className="space-y-0.5 p-4">
          <p className="mb-2 px-3 text-xs font-bold uppercase tracking-wider text-slate-400">
            Content
          </p>
          <SidebarLink href="/dashboard" label="Dashboard" />
          <SidebarLink href="/dashboard/products" label="Products" />
          <SidebarLink href="/dashboard/categories" label="Categories" />
          <SidebarLink href="/dashboard/pages" label="Pages" />
          <SidebarLink href="/dashboard/navigation" label="Navigation" />
          <SidebarLink href="/dashboard/media" label="Media" />
          <p className="mb-2 mt-4 px-3 text-xs font-bold uppercase tracking-wider text-slate-400">
            Discovery
          </p>
          <SidebarLink href="/dashboard/discovery" label="Site Discovery" />
          <SidebarLink href="/dashboard/discovery/urls" label="Discovered URLs" />
          <p className="mb-2 mt-4 px-3 text-xs font-bold uppercase tracking-wider text-slate-400">
            Settings
          </p>
          <SidebarLink href="/dashboard/settings" label="General" />
          <SidebarLink href="/dashboard/seo" label="SEO" />
        </nav>
        <div className="border-t border-slate-700 p-4">
          <p className="px-3 text-xs text-slate-400">
            Signed in as <span className="font-medium text-slate-200">{user.username}</span>
          </p>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}

function SidebarLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center rounded px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-700 hover:text-white"
    >
      {label}
    </Link>
  );
}
