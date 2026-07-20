"use client";

import { useEffect, useState } from "react";

export default function MediaConsolidatedPage() {
  const [images, setImages] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"images" | "videos">("images");

  useEffect(() => {
    async function load() {
      const [im, vi] = await Promise.all([
        fetch("/api/images", { cache: "no-store" }).then(r => r.json()),
        fetch("/api/videos", { cache: "no-store" }).then(r => r.json()),
      ]);
      setImages(im);
      setVideos(vi);
      setLoading(false);
    }
    load();
  }, []);

  async function saveImage(img: any) {
    setSaving(true);
    await fetch("/api/images", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(img) });
    setSaving(false);
    alert("Image saved");
  }

  async function saveVideo(video: any) {
    setSaving(true);
    await fetch("/api/videos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(video) });
    setSaving(false);
    alert("Video saved");
  }

  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-100 text-2xl">Loading...</div>;

  return (
    <div className="p-10">
      <h1 className="mb-8 text-3xl font-bold">Media Library</h1>

      <div className="mb-6 flex gap-2">
        <button onClick={() => setTab("images")} className={`rounded px-6 py-2 font-semibold ${tab === "images" ? "bg-slate-900 text-white" : "bg-white text-slate-900 border"}`}>Images ({images.length})</button>
        <button onClick={() => setTab("videos")} className={`rounded px-6 py-2 font-semibold ${tab === "videos" ? "bg-slate-900 text-white" : "bg-white text-slate-900 border"}`}>Videos ({videos.length})</button>
      </div>

      {tab === "images" && (
        <div className="space-y-6">
          {images.map((img) => (
            <div key={img.id} className="rounded-xl border bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-bold">{img.name}</h2>
              <div className="space-y-4">
                <Field label="Image Path" value={img.path} onChange={(v) => { const c = [...images]; c.find(i => i.id === img.id)!.path = v; setImages(c); }} />
                <Field label="Alt Text" value={img.alt} onChange={(v) => { const c = [...images]; c.find(i => i.id === img.id)!.alt = v; setImages(c); }} />
                <button onClick={() => saveImage(img)} disabled={saving} className="rounded bg-blue-600 px-6 py-2 text-white hover:bg-blue-700">Save</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "videos" && (
        <div className="space-y-6">
          {videos.map((video) => (
            <div key={video.id} className="rounded-xl border bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-bold">{video.name}</h2>
              <div className="space-y-4">
                <Field label="Video Path" value={video.path} onChange={(v) => { const c = [...videos]; c.find((x: any) => x.id === video.id)!.path = v; setVideos(c); }} />
                <Field label="Poster Image Path" value={video.poster} onChange={(v) => { const c = [...videos]; c.find((x: any) => x.id === video.id)!.poster = v; setVideos(c); }} />
                <button onClick={() => saveVideo(video)} disabled={saving} className="rounded bg-blue-600 px-6 py-2 text-white hover:bg-blue-700">Save</button>
              </div>
            </div>
          ))}
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
