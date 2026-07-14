"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type DashboardData = {
  theme: { site_name: string } | null;
  navigation: { label: string; href: string }[];
  benefits: { id: number; icon: string; title: string }[];
  team: { id: number; name: string; position: string }[];
  images: { id: number; name: string; path: string }[];
  videos: { id: number; name: string; path: string }[];
  seo: { title: string } | null;
};

export default function DashboardHome() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [th, na, be, tm, im, vi, se] = await Promise.all([
        fetch("/api/theme", { cache: "no-store" }).then(r => r.json()),
        fetch("/api/navigation", { cache: "no-store" }).then(r => r.json()),
        fetch("/api/benefits", { cache: "no-store" }).then(r => r.json()),
        fetch("/api/team", { cache: "no-store" }).then(r => r.json()),
        fetch("/api/images", { cache: "no-store" }).then(r => r.json()),
        fetch("/api/videos", { cache: "no-store" }).then(r => r.json()),
        fetch("/api/seo", { cache: "no-store" }).then(r => r.json()),
      ]);
      setData({ theme: th, navigation: na, benefits: be, team: tm, images: im, videos: vi, seo: se });
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-gray-100 text-2xl">Loading Dashboard...</div>;
  }

  if (!data) {
    return <div className="flex h-screen items-center justify-center bg-gray-100 text-2xl text-red-600">Failed to load.</div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-64 shrink-0 bg-slate-900 text-white">
        <div className="border-b border-slate-700 p-6">
          <h1 className="text-2xl font-bold">{data.theme?.site_name ?? "Website"} CMS</h1>
        </div>
        <nav className="space-y-0.5 p-4">
          <p className="mb-2 px-3 text-xs font-bold uppercase tracking-wider text-slate-400">Website Sections</p>
          <NavLink href="/dashboard/hero-consolidated" label="Hero" />
          <NavLink href="/dashboard/header-consolidated" label="Header" />
          <NavLink href="/dashboard/technology-consolidated" label="Technology" />
          <NavLink href="/dashboard/team-consolidated" label="Team" />
          <NavLink href="/dashboard/footer-consolidated" label="Footer" />
          <NavLink href="/dashboard/media-consolidated" label="Media" />
          <p className="mb-2 mt-4 px-3 text-xs font-bold uppercase tracking-wider text-slate-400">Meta</p>
          <NavLink href="/dashboard/theme" label="Theme" />
          <NavLink href="/dashboard/seo" label="SEO" />
        </nav>
      </aside>

      <main className="flex-1 space-y-8 overflow-y-auto p-10">
        <div>
          <h2 className="mb-2 text-4xl font-bold">{data.theme?.site_name ?? "Website"} CMS</h2>
          <p className="text-gray-600">
            {data.navigation.length} nav items · {data.benefits.length} benefits · {data.team.length} team members · {data.images.length} images · {data.videos.length} videos
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <SectionCard href="/dashboard/hero-consolidated" icon="🌟" title="Hero" desc="Title lines, animated words, video, poster" />
          <SectionCard href="/dashboard/header-consolidated" icon="🧩" title="Header" desc="Navigation items, logo, contact button" />
          <SectionCard href="/dashboard/technology-consolidated" icon="🔬" title="Technology" desc="Section text, paragraphs, benefits, CTA" />
          <SectionCard href="/dashboard/team-consolidated" icon="👥" title="Team" desc="Members, bios, section headings" />
          <SectionCard href="/dashboard/footer-consolidated" icon="📞" title="Footer" desc="Description, address, copyright, contact" />
          <SectionCard href="/dashboard/media-consolidated" icon="🖼" title="Media" desc="Images and videos" />
          <SectionCard href="/dashboard/theme" icon="🎨" title="Theme" desc="Colors, fonts, site name" />
          <SectionCard href="/dashboard/seo" icon="⚙" title="SEO" desc="Title, description, keywords, robots" />
        </div>

        <div className="rounded-xl border border-dashed border-gray-400 bg-white/50 p-6">
          <p className="text-sm text-gray-500">
            Legacy pages (per-table) still available for advanced editing:
            {["hero", "hero-animated", "header", "header-settings", "technology-section", "benefits", "team", "team-section-text", "footer", "footer-details", "images", "videos"].map(s => (
              <Link key={s} href={`/dashboard/${s}`} className="mx-1 text-blue-600 hover:underline">/{s}</Link>
            ))}
          </p>
        </div>
      </main>
    </div>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="block rounded px-3 py-1.5 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-700 hover:text-white">
      {label}
    </Link>
  );
}

function SectionCard({ href, icon, title, desc }: { href: string; icon: string; title: string; desc: string }) {
  return (
    <Link href={href} className="rounded-xl bg-white p-6 shadow transition hover:shadow-lg">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-2xl">{icon}</span>
        <h3 className="text-xl font-bold">{title}</h3>
      </div>
      <p className="text-sm text-gray-500">{desc}</p>
      <span className="mt-3 inline-block text-sm font-medium text-blue-600 hover:underline">Edit →</span>
    </Link>
  );
}
