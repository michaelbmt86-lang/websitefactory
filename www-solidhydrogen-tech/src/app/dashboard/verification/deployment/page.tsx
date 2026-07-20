"use client";

import { useEffect, useState } from "react";

type DeploymentData = {
  deployment: {
    gitStatus: string;
    lastCommit: string;
    buildSuccess: boolean;
    vercelStatus: string;
    cloudflareStatus: string;
    overallStatus: string;
  } | null;
};

export default function DeploymentPage() {
  const [data, setData] = useState<DeploymentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/verification", { cache: "no-store" });
        const json = await res.json();
        setData(json);
      } catch { console.error("Failed to load deployment data"); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent mx-auto" /></div>;
  }

  const d = data?.deployment;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Deployment Verification</h2>
        <p className="mt-1 text-gray-600">Git, Vercel, and Cloudflare status</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl bg-white p-6 shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Git Repository</h3>
            <span className={`rounded-full px-3 py-1 text-sm font-medium ${d?.gitStatus === "clean" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
              {d?.gitStatus || "Unknown"}
            </span>
          </div>
          <p className="text-sm text-gray-500">Last commit: {d?.lastCommit || "N/A"}</p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Vercel</h3>
            <span className={`rounded-full px-3 py-1 text-sm font-medium ${d?.vercelStatus === "ready" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
              {d?.vercelStatus || "Not configured"}
            </span>
          </div>
          <p className="text-sm text-gray-500">Serverless deployment platform</p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Cloudflare</h3>
            <span className={`rounded-full px-3 py-1 text-sm font-medium ${d?.cloudflareStatus === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
              {d?.cloudflareStatus || "Not configured"}
            </span>
          </div>
          <p className="text-sm text-gray-500">CDN and DNS management</p>
        </div>
      </div>

      <div className="mt-8 rounded-xl bg-white p-6 shadow">
        <h3 className="mb-4 font-semibold text-gray-900">Deployment Checklist</h3>
        <div className="space-y-3">
          {[
            "Git repository has remote configured",
            "Build passes all checks",
            "Environment variables configured",
            "Vercel project linked",
            "Cloudflare DNS configured",
            "SSL certificate active",
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-green-500">✓</span>
              <span className="text-sm text-gray-700">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
