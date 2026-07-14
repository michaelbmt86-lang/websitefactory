"use client";

import { useEffect, useState } from "react";

type Benefit = {
  id: number;
  icon: string;
  title: string;
};

export default function BenefitsPage() {
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadBenefits() {
    const res = await fetch("/api/benefits", {
      cache: "no-store",
    });

    const data = await res.json();

    setBenefits(data);
    setLoading(false);
  }

  useEffect(() => {
    loadBenefits();
  }, []);

  async function saveBenefits() {
    setSaving(true);

    await fetch("/api/benefits", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(benefits),
    });

    setSaving(false);

    alert("Benefits Saved Successfully");
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
          Benefits
        </h1>

        <div className="space-y-6">

          {benefits.map((item, index) => (

            <div
              key={item.id}
              className="rounded-lg border p-5"
            >

              <h2 className="mb-4 text-xl font-bold">
                Benefit {index + 1}
              </h2>

              <div className="mb-4">

                <label className="mb-2 block font-semibold">
                  Icon
                </label>

                <input
                  className="w-full rounded border border-gray-300 bg-white p-3 text-black"
                  value={item.icon}
                  onChange={(e) => {
                    const copy = [...benefits];
                    copy[index].icon = e.target.value;
                    setBenefits(copy);
                  }}
                />

              </div>

              <div>

                <label className="mb-2 block font-semibold">
                  Title
                </label>

                <input
                  className="w-full rounded border border-gray-300 bg-white p-3 text-black"
                  value={item.title}
                  onChange={(e) => {
                    const copy = [...benefits];
                    copy[index].title = e.target.value;
                    setBenefits(copy);
                  }}
                />

              </div>

            </div>

          ))}

          <button
            onClick={saveBenefits}
            disabled={saving}
            className="rounded-lg bg-blue-600 px-8 py-3 text-white hover:bg-blue-700"
          >
            {saving ? "Saving..." : "Save Benefits"}
          </button>

        </div>

      </div>

    </div>
  );
}