"use client";

import { useEffect, useState } from "react";

type Collection = {
  id: number;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  product_count: number;
  products_json: string;
};

export default function CmsCollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/cms-generator", { cache: "no-store" });
        const json = await res.json();
        setCollections(json.collections || []);
      } catch { console.error("Failed to load collections"); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent mx-auto" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">CMS Collections</h2>
        <p className="mt-1 text-gray-600">{collections.length} collections generated from categories</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map(collection => {
          let productCount = 0;
          try {
            const products = JSON.parse(collection.products_json || "[]");
            productCount = products.length;
          } catch { /* skip */ }

          return (
            <div key={collection.id} className="rounded-xl bg-white p-6 shadow transition hover:shadow-md">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100 text-teal-600 font-bold text-sm">
                  {collection.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{collection.name}</h3>
                  <p className="text-xs text-gray-500 font-mono">/{collection.slug}</p>
                </div>
              </div>
              <p className="mb-3 text-sm text-gray-600">{collection.description}</p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{productCount} products</span>
                {collection.image_url ? <span className="text-green-600">Has image</span> : <span className="text-yellow-600">No image</span>}
              </div>
            </div>
          );
        })}
      </div>

      {collections.length === 0 && (
        <div className="rounded-xl bg-white p-12 text-center shadow">
          <div className="mb-4 text-5xl">📁</div>
          <h3 className="mb-2 text-xl font-semibold text-gray-900">No Collections Found</h3>
          <p className="text-gray-600">Run CMS Generation to create collections from categories.</p>
        </div>
      )}
    </div>
  );
}
