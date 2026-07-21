"use client";

import { useEffect, useState } from "react";

type NavigationItem = {
  id: number;
  label: string;
  href: string;
  sort_order: number;
};

export default function HeaderPage() {
  const [navigation, setNavigation] = useState<NavigationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadNavigation() {
    const res = await fetch("/api/navigation", {
      cache: "no-store",
    });

    const data = await res.json();

    setNavigation(data);
    setLoading(false);
  }

  useEffect(() => {
    loadNavigation();
  }, []);

  async function saveNavigation() {
    setSaving(true);

    await fetch("/api/navigation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(navigation),
    });

    setSaving(false);

    alert("Header Saved Successfully");
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-2xl">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-10">

      <div className="mx-auto max-w-5xl rounded-xl bg-white p-8 shadow">

        <h1 className="mb-8 text-3xl font-bold">
          Header Navigation
        </h1>

        <div className="space-y-6">

          {navigation.map((item, index) => (

            <div
              key={item.id}
              className="rounded-lg border p-5"
            >

              <h2 className="mb-4 text-xl font-bold">
                Menu {index + 1}
              </h2>

              <div className="mb-4">

                <label className="mb-2 block font-semibold">
                  Label
                </label>

                <input
                  className="w-full rounded border border-gray-300 bg-white p-3 text-black"
                  value={item.label}
                  onChange={(e) => {
                    const copy = [...navigation];
                    copy[index].label = e.target.value;
                    setNavigation(copy);
                  }}
                />

              </div>

              <div>

                <label className="mb-2 block font-semibold">
                  Link
                </label>

                <input
                  className="w-full rounded border border-gray-300 bg-white p-3 text-black"
                  value={item.href}
                  onChange={(e) => {
                    const copy = [...navigation];
                    copy[index].href = e.target.value;
                    setNavigation(copy);
                  }}
                />

              </div>

            </div>

          ))}

          <button
            onClick={saveNavigation}
            disabled={saving}
            className="rounded-lg bg-blue-600 px-8 py-3 text-white hover:bg-blue-700"
          >
            {saving ? "Saving..." : "Save Header"}
          </button>

        </div>

      </div>

    </div>
  );
}