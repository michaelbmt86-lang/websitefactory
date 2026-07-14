"use client";

import { useEffect, useState } from "react";

type SEO = {
  title: string;
  description: string;
  keywords: string;
  og_image: string;
  canonical: string;
  robots: string;
};

export default function SEOPage() {

  const [seo, setSeo] = useState<SEO>({
    title: "",
    description: "",
    keywords: "",
    og_image: "",
    canonical: "",
    robots: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSEO();
  }, []);

  async function loadSEO() {

    const res = await fetch("/api/seo", {
      cache: "no-store",
    });

    const data = await res.json();

    setSeo(data);

    setLoading(false);

  }

  async function saveSEO() {

    setSaving(true);

    await fetch("/api/seo", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(seo),
    });

    setSaving(false);

    alert("SEO Saved");

  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-2xl">
        Loading...
      </div>
    );
  }

  return (

    <div className="p-10">

      <h1 className="mb-8 text-3xl font-bold">
        SEO CMS
      </h1>

      <div className="space-y-6 rounded-xl bg-white p-8 shadow">

        <Field
          label="Title"
          value={seo.title}
          onChange={(v) => setSeo({ ...seo, title: v })}
        />

        <Field
          label="Description"
          value={seo.description}
          onChange={(v) => setSeo({ ...seo, description: v })}
        />

        <Field
          label="Keywords"
          value={seo.keywords}
          onChange={(v) => setSeo({ ...seo, keywords: v })}
        />

        <Field
          label="OpenGraph Image"
          value={seo.og_image}
          onChange={(v) => setSeo({ ...seo, og_image: v })}
        />

        <Field
          label="Canonical URL"
          value={seo.canonical}
          onChange={(v) => setSeo({ ...seo, canonical: v })}
        />

        <Field
          label="Robots"
          value={seo.robots}
          onChange={(v) => setSeo({ ...seo, robots: v })}
        />

        <button
          onClick={saveSEO}
          disabled={saving}
          className="rounded-lg bg-blue-600 px-8 py-3 text-white hover:bg-blue-700"
        >
          {saving ? "Saving..." : "Save SEO"}
        </button>

      </div>

    </div>

  );

}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {

  return (

    <div>

      <label className="mb-2 block font-semibold">
        {label}
      </label>

      <input
        className="w-full rounded border border-gray-300 bg-white p-3 text-black"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />

    </div>

  );

}