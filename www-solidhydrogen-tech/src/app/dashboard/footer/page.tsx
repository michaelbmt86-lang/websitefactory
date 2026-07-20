"use client";

import { useEffect, useState } from "react";

type Footer = {
  id: number;
  address: string;
  copyright: string;
  email: string;
};

export default function FooterPage() {
  const [footer, setFooter] = useState<Footer>({
    id: 1,
    address: "",
    copyright: "",
    email: "",
  });

  const [saving, setSaving] = useState(false);

  async function loadFooter() {
    const res = await fetch("/api/footer", {
      cache: "no-store",
    });

    const data = await res.json();

    setFooter(data);
  }

  useEffect(() => {
    loadFooter();
  }, []);

  async function saveFooter() {
    setSaving(true);

    await fetch("/api/footer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(footer),
    });

    setSaving(false);

    alert("Footer Saved Successfully");
  }

  return (
    <div className="p-10">

      <h1 className="mb-8 text-3xl font-bold">
        Footer CMS
      </h1>

      <div className="rounded-xl border bg-white p-8 shadow">

        <div className="space-y-6">

          <div>

            <label className="mb-2 block font-semibold">
              Address
            </label>

            <input
              className="w-full rounded border border-gray-300 bg-white p-3 text-black"
              value={footer.address}
              onChange={(e) =>
                setFooter({
                  ...footer,
                  address: e.target.value,
                })
              }
            />

          </div>

          <div>

            <label className="mb-2 block font-semibold">
              Copyright
            </label>

            <input
              className="w-full rounded border border-gray-300 bg-white p-3 text-black"
              value={footer.copyright}
              onChange={(e) =>
                setFooter({
                  ...footer,
                  copyright: e.target.value,
                })
              }
            />

          </div>

          <div>

            <label className="mb-2 block font-semibold">
              Email
            </label>

            <input
              className="w-full rounded border border-gray-300 bg-white p-3 text-black"
              value={footer.email}
              onChange={(e) =>
                setFooter({
                  ...footer,
                  email: e.target.value,
                })
              }
            />

          </div>

          <button
            onClick={saveFooter}
            disabled={saving}
            className="rounded-lg bg-blue-600 px-8 py-3 text-white hover:bg-blue-700"
          >
            {saving ? "Saving..." : "Save Footer"}
          </button>

        </div>

      </div>

    </div>
  );
}