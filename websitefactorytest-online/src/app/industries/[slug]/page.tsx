import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import {
  getNavigation,
  getSettings,
  getCategoryBySlug,
  getPageBySlug,
} from "@/lib/site";
import { ArrowRightIcon } from "@/components/icons";

function slugToIndustryName(slug: string): string {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function generateStaticParams() {
  return [];
}

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const settings = getSettings();
  const siteName = settings.site_name || process.env.SITE_NAME || "";
  const category = getCategoryBySlug(slug);
  const page = getPageBySlug(`industries/${slug}`);
  const name = page?.title || category?.name || slugToIndustryName(slug);

  return {
    title: `${name}${siteName ? ` | ${siteName}` : ""}`,
    description:
      page?.meta_description ||
      category?.description ||
      `${name} solutions.`,
  };
}

export default async function IndustryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const settings = getSettings();
  const category = getCategoryBySlug(slug);
  const page = getPageBySlug(`industries/${slug}`);
  const name = page?.title || category?.name || slugToIndustryName(slug);
  const description =
    page?.meta_description ||
    category?.description ||
    `Solutions tailored for the ${name} industry.`;
  const features = [
    "Quality products",
    "Custom branding options",
    "Next-day metro delivery",
    "Volume pricing available",
    "Dedicated account management",
  ];

  const navItems = getNavigation().map((item) => ({
    label: item.label,
    href: item.href,
  }));

  return (
    <>
      <SiteHeader navItems={navItems} logo={settings.logo} />
      <main>
        {/* Hero */}
        <section className="relative flex min-h-[360px] items-center bg-[#007A55] px-4 py-20 md:min-h-[420px]">
          <div className="mx-auto max-w-[1280px] text-center">
            <h1 className="mb-4 text-4xl font-extrabold text-white md:text-5xl lg:text-6xl">
              {name}
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-white/90 md:text-xl">
              Industry Solutions
            </p>
          </div>
        </section>

        {/* CMS Content or Fallback */}
        {page?.content ? (
          <section className="px-4 py-16 md:py-20">
            <div className="mx-auto max-w-3xl">
              <div
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: page.content }}
              />
            </div>
          </section>
        ) : (
          <>
            {/* Overview */}
            <section className="px-4 py-16 md:py-20">
              <div className="mx-auto max-w-[1280px]">
                <div className="mx-auto max-w-3xl text-center">
                  <h2 className="mb-6 text-3xl font-extrabold text-[#252525] md:text-4xl">
                    How We Serve {name}
                  </h2>
                  <p className="text-lg leading-relaxed text-[#52525C] md:text-xl">
                    {description}
                  </p>
                </div>
              </div>
            </section>

            {/* Features */}
            <section className="bg-[#f8f9fa] px-4 py-16 md:py-20">
              <div className="mx-auto max-w-[1280px]">
                <div className="mb-12 text-center">
                  <h2 className="mb-3 text-3xl font-extrabold text-[#252525] md:text-4xl">
                    What We Offer
                  </h2>
                  <p className="text-base text-[#52525C] md:text-lg">
                    Everything your business needs
                  </p>
                </div>

                <div className="mx-auto max-w-3xl">
                  <div className="space-y-4">
                    {features.map((feature) => (
                      <div
                        key={feature}
                        className="flex items-start gap-4 rounded-xl bg-white p-6 shadow-sm"
                      >
                        <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-[#007A55]" />
                        <span className="text-base text-[#252525]">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {/* CTA */}
        <section className="px-4 py-16 md:py-20">
          <div className="mx-auto max-w-[1280px] text-center">
            <h2 className="mb-4 text-3xl font-extrabold text-[#252525] md:text-4xl">
              Ready to Get Started?
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-[#52525C]">
              Request a free quote or speak with one of our specialists to find
              the right solution for your {name.toLowerCase()} business.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-lg bg-[#007A55] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#006145]"
              >
                Contact Us
                <ArrowRightIcon size={16} />
              </Link>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 rounded-lg border border-[#007A55] px-6 py-3 text-sm font-semibold text-[#007A55] transition-colors hover:bg-[#007A55]/5"
              >
                View Products
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
