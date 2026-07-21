"use client";

import { useEffect, useState } from "react";

type VideoItem = {
  id: number;
  name: string;
  path: string;
  poster: string;
};

export default function VideosPage() {

  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [saving, setSaving] = useState(false);

  async function loadVideos() {

    const res = await fetch("/api/videos", {
      cache: "no-store",
    });

    const data = await res.json();

    setVideos(data);

  }

  useEffect(() => {
    loadVideos();
  }, []);

  async function save(video: VideoItem) {

    setSaving(true);

    await fetch("/api/videos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(video),
    });

    setSaving(false);

    alert("Video Saved");

  }

  return (

    <div className="p-10">

      <h1 className="mb-8 text-3xl font-bold">
        Videos CMS
      </h1>

      <div className="space-y-8">

        {videos.map((video) => (

          <div
            key={video.id}
            className="rounded-xl border bg-white p-6 shadow"
          >

            <h2 className="mb-4 text-xl font-bold">
              {video.name}
            </h2>

            <div className="space-y-4">

              <div>

                <label className="mb-2 block font-semibold">
                  Video Path
                </label>

                <input
                  className="w-full rounded border border-gray-300 bg-white p-3 text-black"
                  value={video.path}
                  onChange={(e) => {

                    const copy = [...videos];

                    copy.find(v => v.id === video.id)!.path = e.target.value;

                    setVideos(copy);

                  }}
                />

              </div>

              <div>

                <label className="mb-2 block font-semibold">
                  Poster
                </label>

                <input
                  className="w-full rounded border border-gray-300 bg-white p-3 text-black"
                  value={video.poster}
                  onChange={(e) => {

                    const copy = [...videos];

                    copy.find(v => v.id === video.id)!.poster = e.target.value;

                    setVideos(copy);

                  }}
                />

              </div>

              <button
                onClick={() => save(video)}
                disabled={saving}
                className="rounded bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
              >
                Save
              </button>

            </div>

          </div>

        ))}

      </div>

    </div>

  );

}