"use client";

import { useEffect, useState } from "react";

type Data = { id: number; heading_1: string; heading_2: string; heading_3: string; subheading_1: string; subheading_2: string; subheading_3: string };

const defaults: Data = { id: 1, heading_1: "", heading_2: "", heading_3: "", subheading_1: "", subheading_2: "", subheading_3: "" };

export default function TeamSectionTextPage() {
  const [data, setData] = useState<Data>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const res = await fetch("/api/team-section-text", { cache: "no-store" });
    setData(await res.json());
    setLoading(false);
  }

  async function save() {
    setSaving(true);
    await fetch("/api/team-section-text", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    setSaving(false);
    alert("Saved");
  }

  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-100 text-2xl">Loading...</div>;

  return (
    <div className="p-10">
      <h1 className="mb-8 text-3xl font-bold">Team Section Text</h1>
      <div className="space-y-6 rounded-xl bg-white p-8 shadow">
        <Field label="Heading Line 1" value={data.heading_1} onChange={(v) => setData({ ...data, heading_1: v })} />
        <Field label="Heading Line 2" value={data.heading_2} onChange={(v) => setData({ ...data, heading_2: v })} />
        <Field label="Heading Line 3" value={data.heading_3} onChange={(v) => setData({ ...data, heading_3: v })} />
        <Field label="Subheading Line 1" value={data.subheading_1} onChange={(v) => setData({ ...data, subheading_1: v })} />
        <Field label="Subheading Line 2" value={data.subheading_2} onChange={(v) => setData({ ...data, subheading_2: v })} />
        <Field label="Subheading Line 3" value={data.subheading_3} onChange={(v) => setData({ ...data, subheading_3: v })} />
        <button onClick={save} disabled={saving} className="rounded-lg bg-blue-600 px-8 py-3 text-white hover:bg-blue-700">{saving ? "Saving..." : "Save"}</button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-2 block font-semibold">{label}</label>
      <input className="w-full rounded border border-gray-300 bg-white p-3 text-black" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
