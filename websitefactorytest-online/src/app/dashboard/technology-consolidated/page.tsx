"use client";

import { useEffect, useState } from "react";

export default function TechnologyConsolidatedPage() {
  const [tech, setTech] = useState<any>(null);
  const [benefits, setBenefits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"text" | "benefits">("text");

  useEffect(() => {
    async function load() {
      const [t, b] = await Promise.all([
        fetch("/api/technology-section", { cache: "no-store" }).then(r => r.json()),
        fetch("/api/benefits", { cache: "no-store" }).then(r => r.json()),
      ]);
      setTech(t);
      setBenefits(b);
      setLoading(false);
    }
    load();
  }, []);

  async function saveTech() {
    setSaving(true);
    await fetch("/api/technology-section", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(tech) });
    setSaving(false);
    alert("Technology text saved");
  }

  async function saveBenefits() {
    setSaving(true);
    await fetch("/api/benefits", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(benefits) });
    setSaving(false);
    alert("Benefits saved");
  }

  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-100 text-2xl">Loading...</div>;

  return (
    <div className="p-10">
      <h1 className="mb-8 text-3xl font-bold">Technology Section</h1>

      <div className="mb-6 flex gap-2 flex-wrap">
        <button onClick={() => setTab("text")} className={`rounded px-6 py-2 font-semibold ${tab === "text" ? "bg-slate-900 text-white" : "bg-white text-slate-900 border"}`}>Section Text</button>
        <button onClick={() => setTab("benefits")} className={`rounded px-6 py-2 font-semibold ${tab === "benefits" ? "bg-slate-900 text-white" : "bg-white text-slate-900 border"}`}>Benefit Cards</button>
      </div>

      {tab === "text" && (
        <div className="space-y-6 rounded-xl bg-white p-8 shadow">
          <h2 className="text-2xl font-bold">Section Text & CTA</h2>
          <Field label="Heading" value={tech.heading} onChange={(v) => setTech({ ...tech, heading: v })} />
          <Field label="Paragraph 1 — Bold Label" value={tech.paragraph1_label} onChange={(v) => setTech({ ...tech, paragraph1_label: v })} />
          <Field label="Paragraph 1 — Body" value={tech.paragraph1_body} onChange={(v) => setTech({ ...tech, paragraph1_body: v })} />
          <Field label="Paragraph 2 — Bold Label" value={tech.paragraph2_label} onChange={(v) => setTech({ ...tech, paragraph2_label: v })} />
          <Field label="Paragraph 2 — Body" value={tech.paragraph2_body} onChange={(v) => setTech({ ...tech, paragraph2_body: v })} />
          <Field label="Benefits Heading" value={tech.benefits_heading} onChange={(v) => setTech({ ...tech, benefits_heading: v })} />
          <Field label="Benefits Subheading" value={tech.benefits_subheading} onChange={(v) => setTech({ ...tech, benefits_subheading: v })} />
          <Field label="CTA — Link Text (underlined)" value={tech.cta_prefix} onChange={(v) => setTech({ ...tech, cta_prefix: v })} />
          <Field label="CTA — Suffix Text" value={tech.cta_suffix} onChange={(v) => setTech({ ...tech, cta_suffix: v })} />
          <Field label="CTA — Email Target" value={tech.cta_email} onChange={(v) => setTech({ ...tech, cta_email: v })} />
          <Field label="CTA — Button Label" value={tech.cta_label} onChange={(v) => setTech({ ...tech, cta_label: v })} />
          <button onClick={saveTech} disabled={saving} className="rounded-lg bg-blue-600 px-8 py-3 text-white hover:bg-blue-700">{saving ? "Saving..." : "Save Section Text"}</button>
        </div>
      )}

      {tab === "benefits" && (
        <div className="space-y-6 rounded-xl bg-white p-8 shadow">
          <h2 className="text-2xl font-bold">Benefit Cards ({benefits.length})</h2>
          {benefits.map((item, i) => (
            <div key={item.id} className="rounded-lg border p-5">
              <h3 className="mb-4 font-bold">Benefit {i + 1}</h3>
              <div className="mb-4">
                <label className="mb-2 block font-semibold">Icon Path</label>
                <input className="w-full rounded border border-gray-300 bg-white p-3 text-black" value={item.icon} onChange={(e) => { const c = [...benefits]; c[i].icon = e.target.value; setBenefits(c); }} />
              </div>
              <div>
                <label className="mb-2 block font-semibold">Title</label>
                <input className="w-full rounded border border-gray-300 bg-white p-3 text-black" value={item.title} onChange={(e) => { const c = [...benefits]; c[i].title = e.target.value; setBenefits(c); }} />
              </div>
            </div>
          ))}
          <button onClick={saveBenefits} disabled={saving} className="rounded-lg bg-blue-600 px-8 py-3 text-white hover:bg-blue-700">{saving ? "Saving..." : "Save Benefits"}</button>
        </div>
      )}
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
