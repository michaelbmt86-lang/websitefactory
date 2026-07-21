"use client";

import { useEffect, useState } from "react";

type TeamMember = {
  id: number;
  name: string;
  position: string;
  bio: string;
  image: string;
};

export default function TeamPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [saving, setSaving] = useState(false);

  async function loadTeam() {
    const res = await fetch("/api/team", {
      cache: "no-store",
    });

    const data = await res.json();

    setTeam(data);
  }

  useEffect(() => {
    loadTeam();
  }, []);

  async function saveTeam() {
    setSaving(true);

    await fetch("/api/team", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(team),
    });

    setSaving(false);

    alert("Team Saved Successfully");
  }

  return (
    <div className="p-10">

      <h1 className="mb-8 text-3xl font-bold">
        Team CMS
      </h1>

      <div className="space-y-10">

        {team.map((member, index) => (

          <div
            key={member.id}
            className="rounded-xl border bg-white p-6 shadow"
          >

            <h2 className="mb-6 text-xl font-bold">
              Member {index + 1}
            </h2>

            <div className="space-y-4">

              <div>

                <label className="mb-2 block font-semibold">
                  Name
                </label>

                <input
                  className="w-full rounded border border-gray-300 bg-white p-3 text-black"
                  value={member.name}
                  onChange={(e) => {
                    const copy = [...team];
                    copy[index].name = e.target.value;
                    setTeam(copy);
                  }}
                />

              </div>

              <div>

                <label className="mb-2 block font-semibold">
                  Position
                </label>

                <input
                  className="w-full rounded border border-gray-300 bg-white p-3 text-black"
                  value={member.position}
                  onChange={(e) => {
                    const copy = [...team];
                    copy[index].position = e.target.value;
                    setTeam(copy);
                  }}
                />

              </div>

              <div>

                <label className="mb-2 block font-semibold">
                  Bio
                </label>

                <textarea
                  rows={4}
                  className="w-full rounded border border-gray-300 bg-white p-3 text-black"
                  value={member.bio}
                  onChange={(e) => {
                    const copy = [...team];
                    copy[index].bio = e.target.value;
                    setTeam(copy);
                  }}
                />

              </div>

              <div>

                <label className="mb-2 block font-semibold">
                  Image
                </label>

                <input
                  className="w-full rounded border border-gray-300 bg-white p-3 text-black"
                  value={member.image}
                  onChange={(e) => {
                    const copy = [...team];
                    copy[index].image = e.target.value;
                    setTeam(copy);
                  }}
                />

              </div>

            </div>

          </div>

        ))}

        <button
          onClick={saveTeam}
          disabled={saving}
          className="rounded-lg bg-blue-600 px-8 py-3 text-white hover:bg-blue-700"
        >
          {saving ? "Saving..." : "Save Team"}
        </button>

      </div>

    </div>
  );
}