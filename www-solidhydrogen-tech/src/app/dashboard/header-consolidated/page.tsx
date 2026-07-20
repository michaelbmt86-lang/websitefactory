"use client";

import { useEffect, useState } from "react";

export default function HeaderConsolidatedPage() {
  const [nav, setNav] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const [n, s] = await Promise.all([
        fetch("/api/navigation", { cache: "no-store" }).then(r => r.json()),
        fetch("/api/header-settings", { cache: "no-store" }).then(r => r.json()),
      ]);
      setNav(n);
      setSettings(s);
      setLoading(false);
    }
    load();
  }, []);

  async function saveNav() {
    setSaving(true);
    await fetch("/api/navigation", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(nav) });
    setSaving(false);
    alert("Navigation saved");
  }

  async function saveSettings() {
    setSaving(true);
    await fetch("/api/header-settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) });
    setSaving(false);
    alert("Header settings saved");
  }

  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-100 text-2xl">Loading...</div>;

  return (
    <div className="p-10">
      <h1 className="mb-8 text-3xl font-bold">Header & Navigation</h1>

      {/* Navigation Items */}
      <div className="mb-8 rounded-xl bg-white p-8 shadow">
        <h2 className="mb-6 text-2xl font-bold">Navigation Items</h2>
        <div className="space-y-6">
          {nav.map((item, i) => (
            <div key={item.id} className="rounded-lg border p-5">
              <h3 className="mb-4 font-bold">Menu {i + 1}</h3>
              <div className="mb-4">
                <label className="mb-2 block font-semibold">Label</label>
                <input className="w-full rounded border border-gray-300 bg-white p-3 text-black" value={item.label} onChange={(e) => { const c = [...nav]; c[i].label = e.target.value; setNav(c); }} />
              </div>
              <div>
                <label className="mb-2 block font-semibold">Link (href)</label>
                <input className="w-full rounded border border-gray-300 bg-white p-3 text-black" value={item.href} onChange={(e) => { const c = [...nav]; c[i].href = e.target.value; setNav(c); }} />
              </div>
            </div>
          ))}
          <button onClick={saveNav} disabled={saving} className="rounded-lg bg-blue-600 px-8 py-3 text-white hover:bg-blue-700">{saving ? "Saving..." : "Save Navigation"}</button>
        </div>
      </div>

      {/* Header Settings */}
      <div className="rounded-xl bg-white p-8 shadow">
        <h2 className="mb-6 text-2xl font-bold">Header Settings</h2>
        <div className="space-y-6">
          <Field label="Logo Image Path" value={settings.logo} onChange={(v) => setSettings({ ...settings, logo: v })} />
          <Field label="Logo Alt Text" value={settings.logo_alt} onChange={(v) => setSettings({ ...settings, logo_alt: v })} />
          <Field label="Contact Button Label" value={settings.contact_button_label} onChange={(v) => setSettings({ ...settings, contact_button_label: v })} />
          <Field label="Contact Email" value={settings.contact_email} onChange={(v) => setSettings({ ...settings, contact_email: v })} />
          <button onClick={saveSettings} disabled={saving} className="rounded-lg bg-blue-600 px-8 py-3 text-white hover:bg-blue-700">{saving ? "Saving..." : "Save Header Settings"}</button>
        </div>
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
