"use client";

import { useEffect, useState } from "react";

export default function HeroConsolidatedPage() {
  const [hero, setHero] = useState<any>(null);
  const [animated, setAnimated] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"main" | "animated">("main");

  useEffect(() => {
    async function load() {
      const [h, a] = await Promise.all([
        fetch("/api/hero", { cache: "no-store" }).then(r => r.json()),
        fetch("/api/hero-animated", { cache: "no-store" }).then(r => r.json()),
      ]);
      setHero(h);
      setAnimated(a);
      setLoading(false);
    }
    load();
  }, []);

  async function saveHero() {
    setSaving(true);
    await fetch("/api/hero", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(hero) });
    setSaving(false);
    alert("Hero saved");
  }

  async function saveAnimated() {
    setSaving(true);
    await fetch("/api/hero-animated", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(animated) });
    setSaving(false);
    alert("Animated words saved");
  }

  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-100 text-2xl">Loading...</div>;

  return (
    <div className="p-10">
      <h1 className="mb-8 text-3xl font-bold">Hero Section</h1>

      <div className="mb-6 flex gap-2">
        <button onClick={() => setTab("main")} className={`rounded px-6 py-2 font-semibold ${tab === "main" ? "bg-slate-900 text-white" : "bg-white text-slate-900 border"}`}>Main</button>
        <button onClick={() => setTab("animated")} className={`rounded px-6 py-2 font-semibold ${tab === "animated" ? "bg-slate-900 text-white" : "bg-white text-slate-900 border"}`}>Animated Words</button>
      </div>

      {tab === "main" && (
        <div className="space-y-6 rounded-xl bg-white p-8 shadow">
          <Field label="Title Line 1" value={hero.title1} onChange={(v) => setHero({ ...hero, title1: v })} />
          <Field label="Title Line 2" value={hero.title2} onChange={(v) => setHero({ ...hero, title2: v })} />
          <Field label="Animated Title 3" value={hero.title3} onChange={(v) => setHero({ ...hero, title3: v })} />
          <Field label="Background Video Path" value={hero.video} onChange={(v) => setHero({ ...hero, video: v })} />
          <Field label="Video Poster Path" value={hero.poster} onChange={(v) => setHero({ ...hero, poster: v })} />
          <button onClick={saveHero} disabled={saving} className="rounded-lg bg-blue-600 px-8 py-3 text-white hover:bg-blue-700">{saving ? "Saving..." : "Save Hero"}</button>
        </div>
      )}

      {tab === "animated" && (
        <div className="space-y-6 rounded-xl bg-white p-8 shadow">
          <Field label="Animated Word 1 (shown first)" value={animated.word1} onChange={(v) => setAnimated({ ...animated, word1: v })} />
          <Field label="Animated Word 2 (cycles in)" value={animated.word2} onChange={(v) => setAnimated({ ...animated, word2: v })} />
          <button onClick={saveAnimated} disabled={saving} className="rounded-lg bg-blue-600 px-8 py-3 text-white hover:bg-blue-700">{saving ? "Saving..." : "Save Animated Words"}</button>
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
