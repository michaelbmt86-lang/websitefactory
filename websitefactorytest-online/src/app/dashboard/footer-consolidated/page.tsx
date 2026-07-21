"use client";

import { useEffect, useState } from "react";

export default function FooterConsolidatedPage() {
  const [footer, setFooter] = useState<any>(null);
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"main" | "details">("main");

  useEffect(() => {
    async function load() {
      const [f, d] = await Promise.all([
        fetch("/api/footer", { cache: "no-store" }).then(r => r.json()),
        fetch("/api/footer-details", { cache: "no-store" }).then(r => r.json()),
      ]);
      setFooter(f);
      setDetails(d);
      setLoading(false);
    }
    load();
  }, []);

  async function saveFooter() {
    setSaving(true);
    await fetch("/api/footer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(footer) });
    setSaving(false);
    alert("Footer saved");
  }

  async function saveDetails() {
    setSaving(true);
    await fetch("/api/footer-details", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(details) });
    setSaving(false);
    alert("Footer details saved");
  }

  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-100 text-2xl">Loading...</div>;

  return (
    <div className="p-10">
      <h1 className="mb-8 text-3xl font-bold">Footer Section</h1>

      <div className="mb-6 flex gap-2">
        <button onClick={() => setTab("main")} className={`rounded px-6 py-2 font-semibold ${tab === "main" ? "bg-slate-900 text-white" : "bg-white text-slate-900 border"}`}>Main Content</button>
        <button onClick={() => setTab("details")} className={`rounded px-6 py-2 font-semibold ${tab === "details" ? "bg-slate-900 text-white" : "bg-white text-slate-900 border"}`}>Location Details</button>
      </div>

      {tab === "main" && (
        <div className="space-y-6 rounded-xl bg-white p-8 shadow">
          <h2 className="text-2xl font-bold">Main Footer Content</h2>
          <div>
            <label className="mb-2 block font-semibold">Description</label>
            <textarea className="w-full rounded border border-gray-300 bg-white p-3 text-black" rows={4} value={footer.description} onChange={(e) => setFooter({ ...footer, description: e.target.value })} />
          </div>
          <Field label="Email" value={footer.email} onChange={(v) => setFooter({ ...footer, email: v })} />
          <Field label="Contact Button Label" value={footer.contact_button_label || "Contact Us"} onChange={(v) => setFooter({ ...footer, contact_button_label: v })} />
          <Field label="Copyright Text" value={footer.copyright} onChange={(v) => setFooter({ ...footer, copyright: v })} />
          <Field label="Region / Country" value={footer.address} onChange={(v) => setFooter({ ...footer, address: v })} />
          <button onClick={saveFooter} disabled={saving} className="rounded-lg bg-blue-600 px-8 py-3 text-white hover:bg-blue-700">{saving ? "Saving..." : "Save Footer"}</button>
        </div>
      )}

      {tab === "details" && (
        <div className="space-y-6 rounded-xl bg-white p-8 shadow">
          <h2 className="text-2xl font-bold">Office Location Details</h2>
          <Field label="Location / Building Name" value={details.location_name} onChange={(v) => setDetails({ ...details, location_name: v })} />
          <Field label="Address Line 1" value={details.address_line1} onChange={(v) => setDetails({ ...details, address_line1: v })} />
          <Field label="Address Line 2" value={details.address_line2} onChange={(v) => setDetails({ ...details, address_line2: v })} />
          <button onClick={saveDetails} disabled={saving} className="rounded-lg bg-blue-600 px-8 py-3 text-white hover:bg-blue-700">{saving ? "Saving..." : "Save Details"}</button>
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
