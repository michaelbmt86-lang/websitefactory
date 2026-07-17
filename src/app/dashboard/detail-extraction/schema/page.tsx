"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type SchemaItem = { slug: string; schemas: { type: string; rawJsonLd: string }[] };

export default function SchemaPage() {
  const [items, setItems] = useState<SchemaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/detail-extraction", { cache: "no-store" })
      .then(r => r.json())
      .then(d => {
        const all: SchemaItem[] = [];
        for (const p of d.products || []) {
          try {
            const schema = JSON.parse(p.schema_json || "[]");
            if (schema.length > 0) all.push({ slug: p.slug, schemas: schema.map((s: { type: string; rawJsonLd: string }) => ({ type: s.type, rawJsonLd: s.rawJsonLd })) });
          } catch { /* skip */ }
        }
        setItems(all);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" /></div>;

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-gray-900">Schema Library</h2><p className="mt-1 text-sm text-gray-600">{items.length} products with schema</p></div>
        <Link href="/dashboard/detail-extraction" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">Back</Link>
      </div>
      {items.length > 0 ? (
        <div className="space-y-4">
          {items.map((item, i) => (
            <div key={i} className="rounded-xl bg-white p-4 shadow">
              <button onClick={() => setExpanded(expanded === i ? null : i)} className="flex w-full items-center justify-between text-left">
                <div>
                  <span className="font-medium text-gray-900">{item.slug}</span>
                  <div className="mt-1 flex gap-2">{item.schemas.map((s, j) => <span key={j} className="rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700">{s.type}</span>)}</div>
                </div>
                <span className="text-gray-400">{expanded === i ? "▲" : "▼"}</span>
              </button>
              {expanded === i && (
                <div className="mt-4 space-y-3">
                  {item.schemas.map((s, j) => (
                    <div key={j}>
                      <p className="mb-1 text-sm font-medium text-gray-700">{s.type}</p>
                      <pre className="overflow-x-auto rounded-lg bg-gray-50 p-3 text-xs text-gray-600">{s.rawJsonLd}</pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl bg-white p-12 text-center shadow"><p className="text-gray-600">No schema data found.</p></div>
      )}
    </div>
  );
}
