"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type FAQItem = { slug: string; faq: { question: string; answer: string }[] };

export default function FAQPage() {
  const [items, setItems] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/detail-extraction", { cache: "no-store" })
      .then(r => r.json())
      .then(d => {
        const all: FAQItem[] = [];
        for (const p of d.products || []) {
          try {
            const faq = JSON.parse(p.faq_json || "[]");
            if (faq.length > 0) all.push({ slug: p.slug, faq });
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
        <div><h2 className="text-2xl font-bold text-gray-900">FAQ</h2><p className="mt-1 text-sm text-gray-600">{items.length} products with FAQ</p></div>
        <Link href="/dashboard/detail-extraction" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">Back</Link>
      </div>
      {items.length > 0 ? (
        <div className="space-y-4">
          {items.map((item, i) => (
            <div key={i} className="rounded-xl bg-white p-6 shadow">
              <h3 className="mb-3 text-lg font-semibold text-gray-900">{item.slug}</h3>
              {item.faq.map((f, j) => (
                <div key={j} className="border-b border-gray-100 py-3 last:border-0">
                  <button onClick={() => setExpanded(expanded === `${i}-${j}` ? null : `${i}-${j}`)} className="flex w-full items-center justify-between text-left">
                    <span className="font-medium text-gray-800">{f.question}</span>
                    <span className="ml-2 text-gray-400">{expanded === `${i}-${j}` ? "▲" : "▼"}</span>
                  </button>
                  {expanded === `${i}-${j}` && <p className="mt-2 text-sm text-gray-600">{f.answer}</p>}
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl bg-white p-12 text-center shadow"><p className="text-gray-600">No FAQ data found.</p></div>
      )}
    </div>
  );
}
