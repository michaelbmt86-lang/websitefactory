"use client";

import { useEffect, useState } from "react";

type RecoveryData = {
  totalUrls: number;
  primarySuccessCount: number;
  recoveryL1Count: number;
  recoveryL2Count: number;
  failedCount: number;
  averageAttempts: number;
  averageDurationMs: number;
  successRate: number;
};

type ExtractionData = {
  completed: number;
  failed: number;
  totalProducts: number;
  coverage: number;
  totalImages: number;
  productsWithSEO: number;
  productsWithSchema: number;
  recovery: RecoveryData;
};

export default function ExtractionRecoveryPage() {
  const [data, setData] = useState<ExtractionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/detail-extraction", { cache: "no-store" });
        const json = await res.json();
        setData(json);
      } catch {
        console.error("Failed to load extraction data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent mx-auto" />
          <p className="text-gray-600">Loading recovery data...</p>
        </div>
      </div>
    );
  }

  const recovery = data?.recovery;
  const successRate = recovery?.successRate ?? 0;
  const primaryRate = recovery?.totalUrls
    ? Math.round((recovery.primarySuccessCount / recovery.totalUrls) * 100)
    : 0;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Extraction Recovery</h2>
        <p className="mt-1 text-gray-600">Multi-engine extraction with automatic fallback recovery.</p>
      </div>

      {/* Engine Priority Banner */}
      <div className="mb-8 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
        <h3 className="text-lg font-semibold">Engine Priority Chain</h3>
        <div className="mt-3 flex items-center gap-3 text-sm">
          <span className="rounded-lg bg-white/20 px-3 py-1 font-medium">Chrome DevTools MCP</span>
          <span className="text-white/60">→</span>
          <span className="rounded-lg bg-white/20 px-3 py-1 font-medium">JCodesMore Browser</span>
          <span className="text-white/60">→</span>
          <span className="rounded-lg bg-white/20 px-3 py-1 font-medium">Firecrawl</span>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Overall Success Rate" value={`${successRate}%`} icon="✅" color="green" />
        <StatCard title="Primary (Chrome MCP)" value={`${primaryRate}%`} icon="🌐" color="blue" />
        <StatCard title="JCodesMore Recovery" value={recovery?.recoveryL1Count ?? 0} icon="🔄" color="orange" />
        <StatCard title="Firecrawl Recovery" value={recovery?.recoveryL2Count ?? 0} icon="🔥" color="red" />
      </div>

      <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total URLs Processed" value={recovery?.totalUrls ?? 0} icon="📊" color="purple" />
        <StatCard title="Failed URLs" value={recovery?.failedCount ?? 0} icon="❌" color="red" />
        <StatCard title="Avg Retry Count" value={recovery?.averageAttempts ?? 0} icon="🔁" color="cyan" />
        <StatCard title="Avg Extraction Time" value={`${recovery?.averageDurationMs ?? 0}ms`} icon="⏱️" color="teal" />
      </div>

      {/* Extraction Coverage */}
      <div className="mb-8 rounded-xl bg-white p-6 shadow">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Extraction Coverage</h3>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-sm text-gray-500">Extracted Products</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{data?.completed ?? 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Products</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{data?.totalProducts ?? 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Failed Products</p>
            <p className="mt-1 text-2xl font-bold text-red-600">{data?.failed ?? 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Coverage</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{data?.coverage ?? 0}%</p>
          </div>
        </div>
      </div>

      {/* Engine Success Rate Bar */}
      <div className="mb-8 rounded-xl bg-white p-6 shadow">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Engine Success Distribution</h3>
        <div className="space-y-4">
          <ProgressBar
            label="Chrome DevTools MCP (Primary)"
            value={recovery?.primarySuccessCount ?? 0}
            total={recovery?.totalUrls ?? 1}
            color="bg-blue-500"
          />
          <ProgressBar
            label="JCodesMore Browser (Recovery L1)"
            value={recovery?.recoveryL1Count ?? 0}
            total={recovery?.totalUrls ?? 1}
            color="bg-orange-500"
          />
          <ProgressBar
            label="Firecrawl (Recovery L2)"
            value={recovery?.recoveryL2Count ?? 0}
            total={recovery?.totalUrls ?? 1}
            color="bg-red-500"
          />
          <ProgressBar
            label="Failed (All Engines)"
            value={recovery?.failedCount ?? 0}
            total={recovery?.totalUrls ?? 1}
            color="bg-gray-400"
          />
        </div>
      </div>

      {/* Recovery Policy */}
      <div className="rounded-xl bg-white p-6 shadow">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Recovery Policy</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <PolicyCard title="Max Retries Per Engine" value="2" icon="🔁" />
          <PolicyCard title="Max Attempts Per URL" value="6" icon="📊" />
          <PolicyCard title="Engine Execution" value="Sequential" icon="🔗" />
          <PolicyCard title="Result Merging" value="None" icon="🚫" />
          <PolicyCard title="Priority Override" value="Never" icon="🔒" />
          <PolicyCard title="Batch Stop" value="Never" icon="✅" />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: string | number; icon: string; color: string }) {
  const colorClasses: Record<string, string> = {
    green: "bg-green-50 text-green-600",
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
    red: "bg-red-50 text-red-600",
    teal: "bg-teal-50 text-teal-600",
    cyan: "bg-cyan-50 text-cyan-600",
  };
  return (
    <div className="rounded-xl bg-white p-6 shadow transition hover:shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`rounded-lg p-3 ${colorClasses[color] ?? "bg-gray-50 text-gray-600"}`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-500">{value} ({pct}%)</span>
      </div>
      <div className="h-3 w-full rounded-full bg-gray-100">
        <div className={`h-3 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function PolicyCard({ title, value, icon }: { title: string; value: string; icon: string }) {
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="text-sm font-medium text-gray-900">{title}</p>
          <p className="text-sm text-gray-500">{value}</p>
        </div>
      </div>
    </div>
  );
}
