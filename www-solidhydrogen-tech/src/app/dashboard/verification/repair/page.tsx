"use client";

import { useEffect, useState } from "react";

type RepairData = {
  totalActions: number;
  fixedCount: number;
  skippedCount: number;
  failedCount: number;
  overallStatus: string;
  actions: {
    category: string;
    action: string;
    message: string;
    entity_type: string;
    entity_slug: string;
    before_value: string;
    after_value: string;
  }[];
};

export default function RepairPage() {
  const [data, setData] = useState<RepairData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/verification", { cache: "no-store" });
        const json = await res.json();
        setData(json.repair);
      } catch { console.error("Failed to load repair data"); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent mx-auto" /></div>;
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Repair Report</h2>
        <p className="mt-1 text-gray-600">{data?.fixedCount ?? 0} fixed, {data?.skippedCount ?? 0} skipped, {data?.failedCount ?? 0} failed</p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl bg-white p-4 shadow"><p className="text-sm text-gray-500">Total Actions</p><p className="text-2xl font-bold text-gray-900">{data?.totalActions ?? 0}</p></div>
        <div className="rounded-xl bg-white p-4 shadow"><p className="text-sm text-gray-500">Fixed</p><p className="text-2xl font-bold text-green-600">{data?.fixedCount ?? 0}</p></div>
        <div className="rounded-xl bg-white p-4 shadow"><p className="text-sm text-gray-500">Skipped</p><p className="text-2xl font-bold text-yellow-600">{data?.skippedCount ?? 0}</p></div>
        <div className="rounded-xl bg-white p-4 shadow"><p className="text-sm text-gray-500">Failed</p><p className="text-2xl font-bold text-red-600">{data?.failedCount ?? 0}</p></div>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 font-medium text-gray-500">Action</th>
              <th className="px-4 py-3 font-medium text-gray-500">Category</th>
              <th className="px-4 py-3 font-medium text-gray-500">Entity</th>
              <th className="px-4 py-3 font-medium text-gray-500">Message</th>
              <th className="px-4 py-3 font-medium text-gray-500">Before</th>
              <th className="px-4 py-3 font-medium text-gray-500">After</th>
            </tr>
          </thead>
          <tbody>
            {(data?.actions || []).slice(0, 300).map((action, i) => (
              <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${action.action === "fixed" ? "bg-green-100 text-green-700" : action.action === "skipped" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>{action.action}</span>
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs">{action.category}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-600">{action.entity_slug || "-"}</td>
                <td className="px-4 py-3 text-gray-500 text-xs max-w-sm truncate">{action.message}</td>
                <td className="px-4 py-3 text-gray-400 text-xs max-w-xs truncate">{action.before_value || "-"}</td>
                <td className="px-4 py-3 text-gray-600 text-xs max-w-xs truncate">{action.after_value || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
