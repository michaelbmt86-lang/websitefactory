"use client";

import { useEffect, useState } from "react";

type Data = { id: number; location_name: string; address_line1: string; address_line2: string };

const defaults: Data = { id: 1, location_name: "", address_line1: "", address_line2: "" };

export default function FooterDetailsPage() {
  const [data, setData] = useState<Data>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const res = await fetch("/api/footer-details", { cache: "no-store" });
    setData(await res.json());
    setLoading(false);
  }

  async function save() {
    setSaving(true);
    await fetch("/api/footer-details", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    setSaving(false);
    alert("Saved");
  }

  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-100 text-2xl">Loading...</div>;

  return (
    <div className="p-10">
      <h1 className="mb-8 text-3xl font-bold">Footer Details</h1>
      <div className="space-y-6 rounded-xl bg-white p-8 shadow">
        <Field label="Location Name" value={data.location_name} onChange={(v) => setData({ ...data, location_name: v })} />
        <Field label="Address Line 1" value={data.address_line1} onChange={(v) => setData({ ...data, address_line1: v })} />
        <Field label="Address Line 2" value={data.address_line2} onChange={(v) => setData({ ...data, address_line2: v })} />
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
