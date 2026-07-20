"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type VerificationData = {
  hasData: boolean;
  verification: {
    siteUrl: string;
    timestamp: string;
    totalChecks: number;
    passedChecks: number;
    warningChecks: number;
    failedChecks: number;
    skippedChecks: number;
    overallStatus: string;
  } | null;
  audit: {
    totalIssues: number;
    errorCount: number;
    warningCount: number;
    infoCount: number;
    fixableCount: number;
    overallStatus: string;
  } | null;
  repair: {
    totalActions: number;
    fixedCount: number;
    skippedCount: number;
    failedCount: number;
    overallStatus: string;
  } | null;
  deployment: {
    gitStatus: string;
    lastCommit: string;
    buildSuccess: boolean;
    vercelStatus: string;
    cloudflareStatus: string;
    overallStatus: string;
  } | null;
};

export default function VerificationDashboard() {
  const [data, setData] = useState<VerificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const res = await fetch("/api/verification", { cache: "no-store" });
      const json = await res.json();
      setData(json);
    } catch { console.error("Failed to load verification data"); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const runVerification = async () => {
    setVerifying(true);
    setError(null);
    try {
      const siteRes = await fetch("/api/discovery", { cache: "no-store" });
      const siteData = await siteRes.json();
      const siteUrl = siteData.siteUrl || siteData.urls?.[0]?.url?.replace(/\/[^/]*$/, "") || "";
      if (!siteUrl) { setError("Run Site Discovery first"); setVerifying(false); return; }
      const res = await fetch("/api/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: siteUrl }),
      });
      const json = await res.json();
      if (json.error) setError(json.error);
      else await loadData();
    } catch (err) { setError(err instanceof Error ? err.message : "Verification failed"); }
    finally { setVerifying(false); }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent mx-auto" />
          <p className="text-gray-600">Loading verification data...</p>
        </div>
      </div>
    );
  }

  const v = data?.verification;
  const a = data?.audit;
  const r = data?.repair;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Delivery & Verification Engine</h2>
        <p className="mt-1 text-gray-600">Verify, audit, and repair CMS data before delivery.</p>
      </div>

      <div className="mb-8 rounded-xl bg-white p-6 shadow">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Run Verification</h3>
            <p className="mt-1 text-sm text-gray-600">Runs: Verify → Audit → Repair → Build → Deploy</p>
          </div>
          <button onClick={runVerification} disabled={verifying} className="rounded-lg bg-violet-600 px-6 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50">
            {verifying ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Verifying...
              </span>
            ) : "Run Verification"}
          </button>
        </div>
        {error && <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
      </div>

      {/* Overall Status */}
      {v && (
        <div className="mb-8 rounded-xl bg-white p-6 shadow">
          <div className="flex items-center gap-4">
            <StatusBadge status={v.overallStatus} size="lg" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Verification Status</h3>
              <p className="text-sm text-gray-500">Last run: {new Date(v.timestamp).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Verification Stats */}
      <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Total Checks" value={v?.totalChecks ?? 0} icon="🔍" color="blue" />
        <StatCard title="Passed" value={v?.passedChecks ?? 0} icon="✅" color="green" />
        <StatCard title="Warnings" value={v?.warningChecks ?? 0} icon="⚠️" color="yellow" />
        <StatCard title="Failed" value={v?.failedChecks ?? 0} icon="❌" color="red" />
        <StatCard title="Skipped" value={v?.skippedChecks ?? 0} icon="⏭️" color="gray" />
      </div>

      {/* Audit & Repair Stats */}
      <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Audit Issues" value={a?.totalIssues ?? 0} icon="🔎" color="orange" />
        <StatCard title="Fixable" value={a?.fixableCount ?? 0} icon="🔧" color="teal" />
        <StatCard title="Repairs Fixed" value={r?.fixedCount ?? 0} icon="🛠️" color="green" />
        <StatCard title="Repair Failed" value={r?.failedCount ?? 0} icon="❌" color="red" />
      </div>

      {/* Navigation Links */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <NavCard href="/dashboard/verification/audit" title="Audit Report" description="Detailed audit issues and categories" icon="🔎" />
        <NavCard href="/dashboard/verification/repair" title="Repair Report" description="Auto-repair actions and results" icon="🔧" />
        <NavCard href="/dashboard/verification/build" title="Build Status" description="Typecheck, lint, build verification" icon="🏗️" />
        <NavCard href="/dashboard/verification/deployment" title="Deployment" description="Git, Vercel, Cloudflare status" icon="🚀" />
        <NavCard href="/dashboard/verification/reports" title="Reports" description="Download all verification reports" icon="📊" />
      </div>

      {!data?.hasData && (
        <div className="mt-8 rounded-xl bg-white p-12 text-center shadow">
          <div className="mb-4 text-5xl">🛡️</div>
          <h3 className="mb-2 text-xl font-semibold text-gray-900">No Verification Data Yet</h3>
          <p className="text-gray-600">Run CMS Generation first, then verify the output.</p>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status, size = "sm" }: { status: string; size?: "sm" | "lg" }) {
  const colors: Record<string, string> = {
    PASS: "bg-green-100 text-green-700",
    WARNING: "bg-yellow-100 text-yellow-700",
    FAILED: "bg-red-100 text-red-700",
    SKIPPED: "bg-gray-100 text-gray-500",
  };
  const sizes = { sm: "px-2 py-0.5 text-xs", lg: "px-4 py-2 text-lg font-bold" };
  return (
    <span className={`rounded-full font-medium ${colors[status] || colors.SKIPPED} ${sizes[size]}`}>
      {status}
    </span>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: string | number; icon: string; color: string }) {
  const colorClasses: Record<string, string> = {
    green: "bg-green-50 text-green-600", blue: "bg-blue-50 text-blue-600",
    yellow: "bg-yellow-50 text-yellow-600", red: "bg-red-50 text-red-600",
    orange: "bg-orange-50 text-orange-600", teal: "bg-teal-50 text-teal-600",
    gray: "bg-gray-50 text-gray-600",
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

function NavCard({ href, title, description, icon }: { href: string; title: string; description: string; icon: string }) {
  return (
    <Link href={href} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <h4 className="font-medium text-gray-900">{title}</h4>
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        </div>
      </div>
    </Link>
  );
}
