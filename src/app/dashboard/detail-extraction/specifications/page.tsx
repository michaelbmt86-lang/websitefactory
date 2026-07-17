"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type SpecItem = { name: string; value: string; group: string };
type SpecData = { slug: string; specs: SpecItem[] };

export default function SpecificationsPage() {
  const [data, setData] = useState<SpecData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/detail-extraction", { cache: "no-store" })
      .then(r => r.json())
      .then(d => {
        const items: SpecData[] = [];
        for (const p of d.products || []) {
          try {
            const specs = JSON.parse(p.specifications_json || "[]");
            if (specs.length > 0) items.push({ slug: p.slug, specs });
          } catch { /* skip */ }
        }
        setData(items);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" /></div>;

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-gray-900">Specifications</h2><p className="mt-1 text-sm text-gray-600">{data.length} products with specs</p></div>
        <Link href="/dashboard/detail-extraction" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">Back</Link>
      </div>
      {data.length > 0 ? (
        <div className="space-y-6">
          {data.map((item, i) => (
            <div key={i} className="rounded-xl bg-white p-6 shadow">
              <h3 className="mb-3 text-lg font-semibold text-gray-900">{item.slug}</h3>
              <table className="w-full text-left text-sm">
                <tbody>
                  {item.specs.map((spec, j) => (
                    <tr key={j} className="border-b border-gray-100">
                      <td className="py-2 font-medium text-gray-700">{spec.name}</td>
                      <td className="py-2 text-gray-600">{spec.value}</td>
                      <td className="py-2 text-xs text-gray-400">{spec.group}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl bg-white p-12 text-center shadow"><p className="text-gray-600">No specifications found.</p></div>
      )}
    </div>
  );
}
