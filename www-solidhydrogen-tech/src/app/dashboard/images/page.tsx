"use client";

import { useEffect, useState } from "react";

type ImageItem = {
  id: number;
  name: string;
  path: string;
  alt: string;
};

export default function ImagesPage() {

  const [images, setImages] = useState<ImageItem[]>([]);
  const [saving, setSaving] = useState(false);

  async function loadImages() {

    const res = await fetch("/api/images", {
      cache: "no-store",
    });

    const data = await res.json();

    setImages(data);

  }

  useEffect(() => {
    loadImages();
  }, []);

  async function save(image: ImageItem) {

    setSaving(true);

    await fetch("/api/images", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(image),
    });

    setSaving(false);

    alert("Saved");

  }

  return (

    <div className="p-10">

      <h1 className="mb-8 text-3xl font-bold">
        Images CMS
      </h1>

      <div className="space-y-8">

        {images.map((image) => (

          <div
            key={image.id}
            className="rounded-xl border bg-white p-6 shadow"
          >

            <h2 className="mb-4 text-xl font-bold">
              {image.name}
            </h2>

            <div className="space-y-4">

              <div>

                <label className="mb-2 block font-semibold">
                  Image Path
                </label>

                <input
                  className="w-full rounded border border-gray-300 bg-white p-3 text-black"
                  value={image.path}
                  onChange={(e) => {

                    const copy=[...images];

                    copy.find(i=>i.id===image.id)!.path=e.target.value;

                    setImages(copy);

                  }}
                />

              </div>

              <div>

                <label className="mb-2 block font-semibold">
                  Alt Text
                </label>

                <input
                  className="w-full rounded border border-gray-300 bg-white p-3 text-black"
                  value={image.alt}
                  onChange={(e)=>{

                    const copy=[...images];

                    copy.find(i=>i.id===image.id)!.alt=e.target.value;

                    setImages(copy);

                  }}
                />

              </div>

              <button
                onClick={()=>save(image)}
                disabled={saving}
                className="rounded bg-blue-600 px-6 py-2 text-white"
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