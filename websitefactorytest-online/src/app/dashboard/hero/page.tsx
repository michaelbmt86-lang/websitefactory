"use client";

import { useEffect, useState } from "react";

type Hero = {
  id: number;
  title1: string;
  title2: string;
  title3: string;
  video: string;
  poster: string;
};

export default function DashboardPage() {
  const [hero, setHero] = useState<Hero>({
    id: 1,
    title1: "",
    title2: "",
    title3: "",
    video: "",
    poster: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadHero() {
    const res = await fetch("/api/hero", {
      cache: "no-store",
    });

    const data = await res.json();

    setHero(data);

    setLoading(false);
  }

  useEffect(() => {
    loadHero();
  }, []);

  async function saveHero() {
    setSaving(true);

    await fetch("/api/hero", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(hero),
    });

    setSaving(false);

    alert("Hero Saved Successfully");
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-2xl">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* Sidebar */}

      <aside className="w-64 bg-slate-900 text-white">

        <div className="p-6 border-b border-slate-700">

          <h1 className="text-2xl font-bold">
            Website CMS
          </h1>

        </div>

        <nav className="p-6 space-y-3">

          <div className="font-bold text-yellow-400">
            🌟 Hero
          </div>

          <div>🧩 Header</div>

          <div>⭐ Benefits</div>

          <div>👥 Team</div>

          <div>📞 Footer</div>

          <div>🖼 Images</div>

          <div>🎬 Videos</div>

          <div>🎨 Theme</div>

          <div>⚙ SEO</div>

        </nav>

      </aside>

      {/* Main */}

      <main className="flex-1 p-10">

        <div className="bg-white rounded-xl shadow p-8">

          <h2 className="text-3xl font-bold mb-8">

            Hero Section

          </h2>

          <div className="space-y-6">

            <div>

              <label className="block mb-2 font-semibold">

                Line 1

              </label>

              <input
                className="border rounded w-full p-3 bg-white text-black caret-black"
                value={hero.title1}
                onChange={(e) =>
                  setHero({
                    ...hero,
                    title1: e.target.value,
                  })
                }
              />

            </div>

            <div>

              <label className="block mb-2 font-semibold">

                Line 2

              </label>

              <input
                className="w-full rounded border border-gray-300 bg-white p-3 text-black placeholder:text-gray-400 caret-black focus:border-blue-500 focus:outline-none"
                value={hero.title2}
                onChange={(e) =>
                  setHero({
                    ...hero,
                    title2: e.target.value,
                  })
                }
              />

            </div>

            <div>

              <label className="block mb-2 font-semibold">

                Line 3

              </label>

              <input
                className="w-full rounded border border-gray-300 bg-white p-3 text-black placeholder:text-gray-400 caret-black focus:border-blue-500 focus:outline-none"
                value={hero.title3}
                onChange={(e) =>
                  setHero({
                    ...hero,
                    title3: e.target.value,
                  })
                }
              />

            </div>

            <div>

              <label className="block mb-2 font-semibold">

                Video

              </label>

              <input
                className="w-full rounded border border-gray-300 bg-white p-3 text-black placeholder:text-gray-400 caret-black focus:border-blue-500 focus:outline-none"
                value={hero.video}
                onChange={(e) =>
                  setHero({
                    ...hero,
                    video: e.target.value,
                  })
                }
              />

            </div>

            <div>

              <label className="block mb-2 font-semibold">

                Poster

              </label>

              <input
                className="w-full rounded border border-gray-300 bg-white p-3 text-black placeholder:text-gray-400 caret-black focus:border-blue-500 focus:outline-none"
                value={hero.poster}
                onChange={(e) =>
                  setHero({
                    ...hero,
                    poster: e.target.value,
                  })
                }
              />

            </div>

            <button
              onClick={saveHero}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg"
            >
              {saving ? "Saving..." : "Save Hero"}
            </button>

          </div>

        </div>

      </main>

    </div>
  );
}