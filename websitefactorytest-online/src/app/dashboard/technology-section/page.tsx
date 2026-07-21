"use client";

import { useEffect, useState } from "react";

type Data = {
  id: number; heading: string;
  paragraph1_label: string; paragraph1_body: string;
  paragraph2_label: string; paragraph2_body: string;
  benefits_heading: string; benefits_subheading: string;
  cta_prefix: string; cta_suffix: string; cta_email: string; cta_label: string;
};

const defaults: Data = {
  id: 1, heading: "", paragraph1_label: "", paragraph1_body: "",
  paragraph2_label: "", paragraph2_body: "",
  benefits_heading: "", benefits_subheading: "",
  cta_prefix: "", cta_suffix: "", cta_email: "", cta_label: "",
};

export default function TechnologySectionPage() {
  const [data, setData] = useState<Data>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const res = await fetch("/api/technology-section", { cache: "no-store" });
    setData(await res.json());
    setLoading(false);
  }

  async function save() {
    setSaving(true);
    await fetch("/api/technology-section", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    setSaving(false);
    alert("Saved");
  }

  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-100 text-2xl">Loading...</div>;

  return (
    <div className="p-10">
      <h1 className="mb-8 text-3xl font-bold">Technology Section</h1>
      <div className="space-y-6 rounded-xl bg-white p-8 shadow">
        <Field label="Heading" value={data.heading} onChange={(v) => setData({ ...data, heading: v })} />
        <Field label="Paragraph 1 — Label" value={data.paragraph1_label} onChange={(v) => setData({ ...data, paragraph1_label: v })} />
        <Field label="Paragraph 1 — Body" value={data.paragraph1_body} onChange={(v) => setData({ ...data, paragraph1_body: v })} />
        <Field label="Paragraph 2 — Label" value={data.paragraph2_label} onChange={(v) => setData({ ...data, paragraph2_label: v })} />
        <Field label="Paragraph 2 — Body" value={data.paragraph2_body} onChange={(v) => setData({ ...data, paragraph2_body: v })} />
        <Field label="Benefits Heading" value={data.benefits_heading} onChange={(v) => setData({ ...data, benefits_heading: v })} />
        <Field label="Benefits Subheading" value={data.benefits_subheading} onChange={(v) => setData({ ...data, benefits_subheading: v })} />
        <Field label="CTA Prefix" value={data.cta_prefix} onChange={(v) => setData({ ...data, cta_prefix: v })} />
        <Field label="CTA Suffix" value={data.cta_suffix} onChange={(v) => setData({ ...data, cta_suffix: v })} />
        <Field label="CTA Email" value={data.cta_email} onChange={(v) => setData({ ...data, cta_email: v })} />
        <Field label="CTA Button Label" value={data.cta_label} onChange={(v) => setData({ ...data, cta_label: v })} />
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
