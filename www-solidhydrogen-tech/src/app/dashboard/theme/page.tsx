"use client";

import { useEffect, useState } from "react";

type Theme = {
  site_name: string;
  logo: string;
  favicon: string;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  text_color: string;
  button_color: string;
  font_family: string;
};

export default function ThemePage() {

  const [theme, setTheme] = useState<Theme>({
    site_name: "",
    logo: "",
    favicon: "",
    primary_color: "",
    secondary_color: "",
    background_color: "",
    text_color: "",
    button_color: "",
    font_family: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTheme();
  }, []);

  async function loadTheme() {

    const res = await fetch("/api/theme", {
      cache: "no-store",
    });

    const data = await res.json();

    setTheme(data);

    setLoading(false);

  }

  async function saveTheme() {

    setSaving(true);

    await fetch("/api/theme", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(theme),
    });

    setSaving(false);

    alert("Theme Saved");

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
        Theme CMS
      </h1>

      <div className="space-y-6 rounded-xl bg-white p-8 shadow">

        <Field
          label="Site Name"
          value={theme.site_name}
          onChange={(v) => setTheme({ ...theme, site_name: v })}
        />

        <Field
          label="Logo"
          value={theme.logo}
          onChange={(v) => setTheme({ ...theme, logo: v })}
        />

        <Field
          label="Favicon"
          value={theme.favicon}
          onChange={(v) => setTheme({ ...theme, favicon: v })}
        />

        <Field
          label="Primary Color"
          value={theme.primary_color}
          onChange={(v) => setTheme({ ...theme, primary_color: v })}
        />

        <Field
          label="Secondary Color"
          value={theme.secondary_color}
          onChange={(v) => setTheme({ ...theme, secondary_color: v })}
        />

        <Field
          label="Background Color"
          value={theme.background_color}
          onChange={(v) => setTheme({ ...theme, background_color: v })}
        />

        <Field
          label="Text Color"
          value={theme.text_color}
          onChange={(v) => setTheme({ ...theme, text_color: v })}
        />

        <Field
          label="Button Color"
          value={theme.button_color}
          onChange={(v) => setTheme({ ...theme, button_color: v })}
        />

        <Field
          label="Font Family"
          value={theme.font_family}
          onChange={(v) => setTheme({ ...theme, font_family: v })}
        />

        <button
          onClick={saveTheme}
          disabled={saving}
          className="rounded-lg bg-blue-600 px-8 py-3 text-white hover:bg-blue-700"
        >
          {saving ? "Saving..." : "Save Theme"}
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