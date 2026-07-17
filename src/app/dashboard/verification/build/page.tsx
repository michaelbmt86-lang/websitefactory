"use client";

import { useEffect, useState } from "react";

type BuildData = {
  buildStatus: string;
  typecheck: string;
  lint: string;
  build: string;
};

export default function BuildPage() {
  const [loading, setLoading] = useState(true);
  const [buildData, setBuildData] = useState<BuildData | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/verification", { cache: "no-store" });
        const json = await res.json();
        const checks = json.verification?.checks || {};
        setBuildData({
          buildStatus: checks.build?.status || "SKIPPED",
          typecheck: checks.typecheck?.status || "SKIPPED",
          lint: checks.lint?.status || "SKIPPED",
          build: checks.build?.status || "SKIPPED",
        });
      } catch {
        console.error("Failed to load build data");
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
          <p className="text-gray-600">Loading build verification...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Build Verification</h2>
        <p className="mt-1 text-gray-600">TypeScript, ESLint, and build status checks.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatusCard title="TypeScript" status={buildData?.typecheck ?? "SKIPPED"} />
        <StatusCard title="ESLint" status={buildData?.lint ?? "SKIPPED"} />
        <StatusCard title="Build" status={buildData?.build ?? "SKIPPED"} />
        <StatusCard title="Overall" status={buildData?.buildStatus ?? "SKIPPED"} />
      </div>
    </div>
  );
}

function StatusCard({ title, status }: { title: string; status: string }) {
  const colorMap: Record<string, string> = {
    PASS: "border-green-500 bg-green-50 text-green-700",
    FAILED: "border-red-500 bg-red-50 text-red-700",
    WARNING: "border-yellow-500 bg-yellow-50 text-yellow-700",
    SKIPPED: "border-gray-300 bg-gray-50 text-gray-500",
  };
  return (
    <div className={`rounded-xl border-2 p-6 ${colorMap[status] ?? "border-gray-300 bg-gray-50 text-gray-500"}`}>
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-2 text-3xl font-bold">{status}</p>
    </div>
  );
}
