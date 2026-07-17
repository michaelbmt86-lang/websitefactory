// ============================================================================
// BLOG POST PAGE (Website Factory Framework)
//
// Patterns:
//   - export const dynamic = "force-dynamic" — REQUIRED for DB-dependent routes
//     On Vercel, the SQLite DB is ephemeral (/tmp). generateStaticParams() would
//     return empty at build time, causing 404s. force-dynamic ensures server-side
//     rendering on every request, after DB init.
//   - generateMetadata() for SEO — returns minimal metadata if post not found
//   - notFound() from next/navigation for 404 handling
// ============================================================================

import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ArrowRightIcon } from "@/components/icons";
import { getPostBySlug } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Post Not Found" };

  return {
    title: `${post.title} | BioPak Blog`,
    description: post.excerpt || `Read ${post.title} on the BioPak blog`,
    openGraph: {
      title: `${post.title} | BioPak Blog`,
      description: post.excerpt,
      images: post.featured_image ? [{ url: post.featured_image }] : [],
      type: "article",
      authors: post.author ? [post.author] : [],
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const formattedDate = new Date(post.created_at).toLocaleDateString("en-AU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <SiteHeader />
      <main>
        {/* Breadcrumb */}
        <div className="bg-[#f8f9fa] px-4 py-4">
          <div className="mx-auto max-w-[1280px]">
            <nav className="flex items-center gap-2 text-sm text-[#52525C]">
              <Link href="/" className="transition-colors hover:text-[#007A55]">
                Home
              </Link>
              <span>/</span>
              <Link
                href="/blog"
                className="transition-colors hover:text-[#007A55]"
              >
                Blog
              </Link>
              <span>/</span>
              <span className="font-medium text-[#252525]">{post.title}</span>
            </nav>
          </div>
        </div>

        {/* Hero */}
        <section className="relative flex min-h-[300px] items-center bg-[#007A55] px-4 py-16 md:min-h-[360px]">
          <div className="mx-auto max-w-[1280px] text-center">
            {post.category && (
              <div className="mb-4 inline-flex rounded-full bg-white/20 px-3 py-1">
                <span className="text-xs font-semibold text-white">
                  {post.category}
                </span>
              </div>
            )}
            <h1 className="mb-4 text-3xl font-extrabold text-white md:text-5xl">
              {post.title}
            </h1>
            <div className="flex items-center justify-center gap-4 text-sm text-white/80">
              {post.author && <span>{post.author}</span>}
              {post.author && <span>&middot;</span>}
              <span>{formattedDate}</span>
            </div>
          </div>
        </section>

        {/* Featured Image */}
        {post.featured_image && (
          <section className="px-4 py-8 md:py-12">
            <div className="mx-auto max-w-[900px]">
              <img
                src={post.featured_image}
                alt={post.title}
                className="w-full rounded-xl object-cover"
              />
            </div>
          </section>
        )}

        {/* Article Content */}
        <article className="px-4 py-8 md:py-12">
          <div className="mx-auto max-w-[900px]">
            <div
              className="prose prose-lg max-w-none text-[#52525C] prose-headings:text-[#252525] prose-headings:font-extrabold prose-a:text-[#007A55] prose-strong:text-[#252525]"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>
        </article>

        {/* Back to Blog */}
        <section className="border-t border-black/5 px-4 py-12">
          <div className="mx-auto max-w-[900px] text-center">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#007A55] transition-all hover:gap-3"
            >
              <ArrowRightIcon size={16} className="rotate-180" />
              Back to All Articles
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
