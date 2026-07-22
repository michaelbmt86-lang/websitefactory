"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRightIcon, LeafIcon } from "@/components/icons";

export default function NotFound() {
  const router = useRouter();

  return (
    <>
      <main className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center px-4 py-20 text-center">
        <LeafIcon size={48} className="mb-6 text-[#007A55]/30" />
        <div className="mb-2 text-8xl font-extrabold text-[#007A55] md:text-9xl">
          404
        </div>
        <h1 className="mb-4 text-2xl font-bold text-[#252525] md:text-3xl">
          Page Not Found
        </h1>
        <p className="mb-8 max-w-md text-base text-[#52525C]">
          Sorry, the page you&apos;re looking for doesn&apos;t exist or has been
          moved. Let&apos;s get you back on track.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-[#007A55] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#006145]"
          >
            <ArrowRightIcon size={16} />
            Go Home
          </Link>
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-lg border border-[#007A55] px-6 py-3 text-sm font-semibold text-[#007A55] transition-colors hover:bg-[#007A55]/5"
          >
            Go Back
          </button>
        </div>
      </main>
      <footer className="bg-[rgb(21,21,21)] px-4 py-8 text-center text-sm text-white/50">
        &copy; {new Date().getFullYear()} All rights reserved.
      </footer>
    </>
  );
}
