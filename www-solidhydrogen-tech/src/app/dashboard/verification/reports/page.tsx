"use client";

import { useEffect, useState } from "react";

type ReportData = {
  verification: unknown;
  audit: unknown;
  repair: unknown;
  deployment: unknown;
};

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/verification", { cache: "no-store" });
        const json = await res.json();
        setData(json);
      } catch { console.error("Failed to load reports"); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const downloadJson = (name: string, content: unknown) => {
    const blob = new Blob([JSON.stringify(content, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-pink-500 border-t-transparent mx-auto" /></div>;
  }

  const reports = [
    { name: "verification-report.json", label: "Verification Report", data: data?.verification as Record<string, unknown> | null | undefined, icon: "🔍" },
    { name: "audit-report.json", label: "Audit Report", data: data?.audit as Record<string, unknown> | null | undefined, icon: "🔎" },
    { name: "repair-report.json", label: "Repair Report", data: data?.repair as Record<string, unknown> | null | undefined, icon: "🔧" },
    { name: "deployment-report.json", label: "Deployment Report", data: data?.deployment as Record<string, unknown> | null | undefined, icon: "🚀" },
  ];

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Verification Reports</h2>
        <p className="mt-1 text-gray-600">Download all verification, audit, and repair reports</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {reports.map(report => (
          <div key={report.name} className="rounded-xl bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{report.icon}</span>
                <div>
                  <h3 className="font-semibold text-gray-900">{report.label}</h3>
                  <p className="text-xs text-gray-500 font-mono">{report.name}</p>
                </div>
              </div>
              <button
                onClick={() => downloadJson(report.name, report.data)}
                disabled={!report.data}
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Download
              </button>
            </div>
            {report.data && (
              <p className="mt-3 text-xs text-gray-500">
                {Object.keys(report.data).length} fields
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
