"use client";

import { useEffect, useState } from "react";

type Brand = {
  id: number;
  name: string;
  slug: string;
  logo_url: string;
  description: string;
  product_count: number;
};

export default function CmsBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/cms-generator", { cache: "no-store" });
        const json = await res.json();
        setBrands(json.brands || []);
      } catch { console.error("Failed to load brands"); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent mx-auto" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">CMS Brands</h2>
        <p className="mt-1 text-gray-600">{brands.length} brands extracted from products</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {brands.map(brand => (
          <div key={brand.id} className="rounded-xl bg-white p-6 shadow transition hover:shadow-md">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600 font-bold text-sm">
                {brand.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{brand.name}</h3>
                <p className="text-xs text-gray-500 font-mono">/{brand.slug}</p>
              </div>
            </div>
            <p className="mb-3 text-sm text-gray-600">{brand.description}</p>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{brand.product_count} products</span>
              {brand.logo_url ? <span className="text-green-600">Has logo</span> : <span className="text-yellow-600">No logo</span>}
            </div>
          </div>
        ))}
      </div>

      {brands.length === 0 && (
        <div className="rounded-xl bg-white p-12 text-center shadow">
          <div className="mb-4 text-5xl">🏷️</div>
          <h3 className="mb-2 text-xl font-semibold text-gray-900">No Brands Found</h3>
          <p className="text-gray-600">Run CMS Generation to extract brands from products.</p>
        </div>
      )}
    </div>
  );
}
