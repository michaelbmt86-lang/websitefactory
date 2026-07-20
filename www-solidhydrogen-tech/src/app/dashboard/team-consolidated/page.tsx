"use client";

import { useEffect, useState } from "react";

export default function TeamConsolidatedPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [text, setText] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"members" | "headings">("members");

  useEffect(() => {
    async function load() {
      const [m, t] = await Promise.all([
        fetch("/api/team", { cache: "no-store" }).then(r => r.json()),
        fetch("/api/team-section-text", { cache: "no-store" }).then(r => r.json()),
      ]);
      setMembers(m);
      setText(t);
      setLoading(false);
    }
    load();
  }, []);

  async function saveMembers() {
    setSaving(true);
    await fetch("/api/team", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(members) });
    setSaving(false);
    alert("Team members saved");
  }

  async function saveText() {
    setSaving(true);
    await fetch("/api/team-section-text", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(text) });
    setSaving(false);
    alert("Section text saved");
  }

  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-100 text-2xl">Loading...</div>;

  return (
    <div className="p-10">
      <h1 className="mb-8 text-3xl font-bold">Team Section</h1>

      <div className="mb-6 flex gap-2">
        <button onClick={() => setTab("members")} className={`rounded px-6 py-2 font-semibold ${tab === "members" ? "bg-slate-900 text-white" : "bg-white text-slate-900 border"}`}>Team Members</button>
        <button onClick={() => setTab("headings")} className={`rounded px-6 py-2 font-semibold ${tab === "headings" ? "bg-slate-900 text-white" : "bg-white text-slate-900 border"}`}>Section Headings</button>
      </div>

      {tab === "members" && (
        <div className="space-y-6 rounded-xl bg-white p-8 shadow">
          <h2 className="text-2xl font-bold">Team Members ({members.length})</h2>
          {members.map((member, i) => (
            <div key={member.id} className="rounded-lg border p-5">
              <h3 className="mb-4 font-bold">Member {i + 1}</h3>
              <div className="space-y-4">
                <Field label="Name" value={member.name} onChange={(v) => { const c = [...members]; c[i].name = v; setMembers(c); }} />
                <Field label="Position" value={member.position} onChange={(v) => { const c = [...members]; c[i].position = v; setMembers(c); }} />
                <div>
                  <label className="mb-2 block font-semibold">Bio</label>
                  <textarea className="w-full rounded border border-gray-300 bg-white p-3 text-black" rows={4} value={member.bio} onChange={(e) => { const c = [...members]; c[i].bio = e.target.value; setMembers(c); }} />
                </div>
                <Field label="Image Path" value={member.image} onChange={(v) => { const c = [...members]; c[i].image = v; setMembers(c); }} />
              </div>
            </div>
          ))}
          <button onClick={saveMembers} disabled={saving} className="rounded-lg bg-blue-600 px-8 py-3 text-white hover:bg-blue-700">{saving ? "Saving..." : "Save Members"}</button>
        </div>
      )}

      {tab === "headings" && (
        <div className="space-y-6 rounded-xl bg-white p-8 shadow">
          <h2 className="text-2xl font-bold">Section Headings</h2>
          <Field label="Heading Line 1" value={text.heading_1} onChange={(v) => setText({ ...text, heading_1: v })} />
          <Field label="Heading Line 2" value={text.heading_2} onChange={(v) => setText({ ...text, heading_2: v })} />
          <Field label="Heading Line 3" value={text.heading_3} onChange={(v) => setText({ ...text, heading_3: v })} />
          <Field label="Subheading Line 1" value={text.subheading_1} onChange={(v) => setText({ ...text, subheading_1: v })} />
          <Field label="Subheading Line 2" value={text.subheading_2} onChange={(v) => setText({ ...text, subheading_2: v })} />
          <Field label="Subheading Line 3" value={text.subheading_3} onChange={(v) => setText({ ...text, subheading_3: v })} />
          <button onClick={saveText} disabled={saving} className="rounded-lg bg-blue-600 px-8 py-3 text-white hover:bg-blue-700">{saving ? "Saving..." : "Save Section Text"}</button>
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
