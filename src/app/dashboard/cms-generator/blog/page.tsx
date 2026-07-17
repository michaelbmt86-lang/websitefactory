"use client";

import { useEffect, useState } from "react";

type BlogPage = {
  id: number;
  url: string;
  slug: string;
  title: string;
  description: string;
  page_type: string;
  status: string;
};

export default function CmsBlogPage() {
  const [posts, setPosts] = useState<BlogPage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/cms-generator", { cache: "no-store" });
        const json = await res.json();
        setPosts((json.pages || []).filter((p: BlogPage) => p.page_type === "blog-post"));
      } catch { console.error("Failed to load blog posts"); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent mx-auto" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">CMS Blog Posts</h2>
        <p className="mt-1 text-gray-600">{posts.length} blog post pages</p>
      </div>

      <div className="space-y-3">
        {posts.map(post => (
          <div key={post.id} className="flex items-center justify-between rounded-xl bg-white p-4 shadow transition hover:shadow-md">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{post.title}</h3>
              <p className="mt-1 text-sm text-gray-500 truncate">{post.description}</p>
              <p className="mt-1 text-xs text-gray-400 font-mono">{post.url}</p>
            </div>
            <div className="ml-4 shrink-0">
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${post.status === "published" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                {post.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {posts.length === 0 && (
        <div className="rounded-xl bg-white p-12 text-center shadow">
          <div className="mb-4 text-5xl">📝</div>
          <h3 className="mb-2 text-xl font-semibold text-gray-900">No Blog Posts Found</h3>
          <p className="text-gray-600">Run CMS Generation to create blog post pages from the posts table.</p>
        </div>
      )}
    </div>
  );
}
