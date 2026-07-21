"use client";

import { useEffect, useState } from "react";

type QualityData = {
  totalEntities: number;
  missingMetadata: number;
  missingSeo: number;
  brokenLinks: number;
  duplicateSlugs: number;
  emptyDescriptions: number;
  issues: {
    entityType: string;
    entityId: number;
    entitySlug: string;
    issueType: string;
    severity: string;
    message: string;
  }[];
};

export default function CmsQualityPage() {
  const [data, setData] = useState<QualityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState("all");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/cms-generator", { cache: "no-store" });
        const json = await res.json();
        setData(json.quality);
      } catch { console.error("Failed to load quality data"); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const filteredIssues = severityFilter === "all"
    ? data?.issues || []
    : (data?.issues || []).filter(i => i.severity === severityFilter);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-red-500 border-t-transparent mx-auto" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">CMS Quality Report</h2>
        <p className="mt-1 text-gray-600">{data?.issues.length ?? 0} total issues across {data?.totalEntities ?? 0} entities</p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">Missing Metadata</p>
          <p className="text-2xl font-bold text-yellow-600">{data?.missingMetadata ?? 0}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">Missing SEO</p>
          <p className="text-2xl font-bold text-orange-600">{data?.missingSeo ?? 0}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">Broken Links</p>
          <p className="text-2xl font-bold text-red-600">{data?.brokenLinks ?? 0}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">Duplicate Slugs</p>
          <p className="text-2xl font-bold text-purple-600">{data?.duplicateSlugs ?? 0}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">Empty Descriptions</p>
          <p className="text-2xl font-bold text-blue-600">{data?.emptyDescriptions ?? 0}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">Total Issues</p>
          <p className="text-2xl font-bold text-gray-900">{data?.issues.length ?? 0}</p>
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        {["all", "error", "warning"].map(s => (
          <button key={s} onClick={() => setSeverityFilter(s)} className={`rounded-lg px-3 py-1 text-sm font-medium capitalize ${severityFilter === s ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
            {s}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 font-medium text-gray-500">Severity</th>
              <th className="px-4 py-3 font-medium text-gray-500">Entity</th>
              <th className="px-4 py-3 font-medium text-gray-500">Type</th>
              <th className="px-4 py-3 font-medium text-gray-500">Issue</th>
              <th className="px-4 py-3 font-medium text-gray-500">Message</th>
            </tr>
          </thead>
          <tbody>
            {filteredIssues.slice(0, 200).map((issue, i) => (
              <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${issue.severity === "error" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {issue.severity}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-600">{issue.entitySlug}</td>
                <td className="px-4 py-3"><span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">{issue.entityType}</span></td>
                <td className="px-4 py-3 text-gray-600">{issue.issueType}</td>
                <td className="px-4 py-3 text-gray-500 text-xs max-w-md truncate">{issue.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
