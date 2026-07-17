"use client";

import { useEffect, useState } from "react";

type AuditData = {
  totalIssues: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  fixableCount: number;
  overallStatus: string;
  issues: {
    category: string;
    severity: string;
    message: string;
    entity_type: string;
    entity_slug: string;
    fixable: boolean;
  }[];
};

export default function AuditPage() {
  const [data, setData] = useState<AuditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/verification", { cache: "no-store" });
        const json = await res.json();
        setData(json.audit);
      } catch { console.error("Failed to load audit data"); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const filtered = filter === "all" ? data?.issues || [] : (data?.issues || []).filter(i => i.severity === filter);
  const categories = [...new Set((data?.issues || []).map(i => i.category))];

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent mx-auto" /></div>;
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Audit Report</h2>
        <p className="mt-1 text-gray-600">{data?.totalIssues ?? 0} issues found — {data?.fixableCount ?? 0} fixable</p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl bg-white p-4 shadow"><p className="text-sm text-gray-500">Errors</p><p className="text-2xl font-bold text-red-600">{data?.errorCount ?? 0}</p></div>
        <div className="rounded-xl bg-white p-4 shadow"><p className="text-sm text-gray-500">Warnings</p><p className="text-2xl font-bold text-yellow-600">{data?.warningCount ?? 0}</p></div>
        <div className="rounded-xl bg-white p-4 shadow"><p className="text-sm text-gray-500">Info</p><p className="text-2xl font-bold text-blue-600">{data?.infoCount ?? 0}</p></div>
        <div className="rounded-xl bg-white p-4 shadow"><p className="text-sm text-gray-500">Fixable</p><p className="text-2xl font-bold text-green-600">{data?.fixableCount ?? 0}</p></div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button onClick={() => setFilter("all")} className={`rounded-lg px-3 py-1 text-sm font-medium ${filter === "all" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700"}`}>All</button>
        <button onClick={() => setFilter("error")} className={`rounded-lg px-3 py-1 text-sm font-medium ${filter === "error" ? "bg-red-600 text-white" : "bg-gray-100 text-gray-700"}`}>Errors</button>
        <button onClick={() => setFilter("warning")} className={`rounded-lg px-3 py-1 text-sm font-medium ${filter === "warning" ? "bg-yellow-500 text-white" : "bg-gray-100 text-gray-700"}`}>Warnings</button>
        <button onClick={() => setFilter("info")} className={`rounded-lg px-3 py-1 text-sm font-medium ${filter === "info" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700"}`}>Info</button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {categories.map(cat => (
          <span key={cat} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">{cat}</span>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 font-medium text-gray-500">Severity</th>
              <th className="px-4 py-3 font-medium text-gray-500">Category</th>
              <th className="px-4 py-3 font-medium text-gray-500">Entity</th>
              <th className="px-4 py-3 font-medium text-gray-500">Message</th>
              <th className="px-4 py-3 font-medium text-gray-500">Fixable</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 300).map((issue, i) => (
              <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${issue.severity === "error" ? "bg-red-100 text-red-700" : issue.severity === "warning" ? "bg-yellow-100 text-yellow-700" : "bg-blue-100 text-blue-700"}`}>{issue.severity}</span>
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs">{issue.category}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-600">{issue.entity_slug || "-"}</td>
                <td className="px-4 py-3 text-gray-500 text-xs max-w-md truncate">{issue.message}</td>
                <td className="px-4 py-3">{issue.fixable ? <span className="text-green-600 text-xs">✓</span> : <span className="text-gray-400 text-xs">✗</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
