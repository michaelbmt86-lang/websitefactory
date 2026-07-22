import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getNavigation, getPosts, getSettings } from "@/lib/site";
import { ArrowRightIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const settings = getSettings();
  const siteName = settings.site_name || process.env.SITE_NAME || "";
  return {
    title: `Blog${siteName ? ` | ${siteName}` : ""}`,
    description: settings.meta_description || `Latest news and articles.`,
  };
}

export default function BlogPage() {
  const settings = getSettings();
  const navItems = getNavigation().map((item) => ({
    label: item.label,
    href: item.href,
  }));

  const posts = getPosts();
  const latestPost = posts[0];
  const remainingPosts = posts.slice(1);

  return (
    <>
      <SiteHeader navItems={navItems} logo={settings.logo} />
      <main>
        {/* Hero Section */}
        <section className="relative flex min-h-[360px] items-center bg-[#007A55] px-4 py-20 md:min-h-[420px]">
          <div className="mx-auto max-w-[1280px] text-center">
            <h1 className="mb-4 text-4xl font-extrabold text-white md:text-5xl lg:text-6xl">
              News &amp; Resources
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-white/90 md:text-xl">
              Latest Updates and Insights
            </p>
          </div>
        </section>

        {/* Featured Post */}
        {latestPost && (
          <section className="px-4 py-12 md:py-16">
            <div className="mx-auto max-w-[1280px]">
              <Link
                href={`/blog/${latestPost.slug}`}
                className="group block rounded-xl border border-black/5 bg-white p-8 transition-all hover:shadow-md md:p-12"
              >
                <div className="mb-4 inline-flex rounded-full bg-[#007A55]/10 px-3 py-1">
                  <span className="text-xs font-semibold text-[#007A55]">
                    Featured
                  </span>
                </div>
                <div className="mb-4 flex items-center gap-3 text-sm text-[#52525C]">
                  <span>{latestPost.category}</span>
                  <span>&middot;</span>
                  <span>{new Date(latestPost.created_at).toLocaleDateString()}</span>
                </div>
                <h2 className="mb-4 text-2xl font-bold text-[#252525] group-hover:text-[#007A55] md:text-3xl">
                  {latestPost.title}
                </h2>
                <p className="mb-6 max-w-3xl text-base leading-relaxed text-[#52525C]">
                  {latestPost.excerpt}
                </p>
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#007A55] transition-all group-hover:gap-3">
                  Read Article <ArrowRightIcon size={16} />
                </span>
              </Link>
            </div>
          </section>
        )}

        {/* Blog Grid */}
        {remainingPosts.length > 0 && (
          <section className="bg-[#f8f9fa] px-4 py-12 md:py-16">
            <div className="mx-auto max-w-[1280px]">
              <h2 className="mb-8 text-2xl font-bold text-[#252525] md:text-3xl">
                Latest Articles
              </h2>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {remainingPosts.map((post) => (
                  <Link
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    className="group flex flex-col rounded-xl bg-white p-6 shadow-sm transition-all hover:shadow-md"
                  >
                    <div className="mb-3 inline-flex w-fit rounded-full bg-[#007A55]/10 px-3 py-1">
                      <span className="text-xs font-semibold text-[#007A55]">
                        {post.category}
                      </span>
                    </div>
                    <h3 className="mb-3 text-lg font-bold text-[#252525] group-hover:text-[#007A55]">
                      {post.title}
                    </h3>
                    <p className="mb-4 flex-1 text-sm leading-relaxed text-[#52525C]">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#52525C]">
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#007A55] transition-all group-hover:gap-2">
                        Read More <ArrowRightIcon size={14} />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {posts.length === 0 && (
          <section className="px-4 py-16 md:py-20">
            <div className="mx-auto max-w-[1280px] text-center">
              <p className="text-lg text-[#52525C]">
                No articles yet. Check back soon!
              </p>
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
