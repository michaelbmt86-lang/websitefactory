"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type MediaAsset = {
  id: number;
  productId: number;
  productSlug: string;
  type: string;
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
  hash: string;
};

export default function ImagesPage() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/detail-extraction", { cache: "no-store" })
      .then(r => r.json())
      .then(d => {
        const allAssets: MediaAsset[] = [];
        for (const p of d.products || []) {
          try {
            const images = JSON.parse(p.images_json || "[]");
            for (const img of images) {
              allAssets.push({ id: 0, productId: p.id, productSlug: p.slug, type: "image", url: img.url || img, alt: img.alt || "", width: img.width || null, height: img.height || null, hash: "" });
            }
          } catch { /* skip */ }
        }
        setAssets(allAssets);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = assets;

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" /></div>;

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Product Images</h2>
          <p className="mt-1 text-sm text-gray-600">{filtered.length} images</p>
        </div>
        <Link href="/dashboard/detail-extraction" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">Back</Link>
      </div>

      {filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((asset, i) => (
            <div key={i} className="rounded-xl bg-white p-4 shadow">
              <div className="mb-2 aspect-square overflow-hidden rounded-lg bg-gray-100">
                <img src={asset.url} alt={asset.alt} className="h-full w-full object-cover" />
              </div>
              <p className="truncate text-sm font-medium text-gray-900">{asset.productSlug}</p>
              <p className="truncate text-xs text-gray-500">{asset.alt || "No alt text"}</p>
              {asset.width && asset.height && <p className="text-xs text-gray-400">{asset.width}x{asset.height}</p>}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl bg-white p-12 text-center shadow"><p className="text-gray-600">No images found.</p></div>
      )}
    </div>
  );
}
