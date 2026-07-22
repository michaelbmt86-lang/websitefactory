import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getNavigation, getSettings, getPageBySlug } from "@/lib/site";
import {
  LeafIcon,
  AwardIcon,
  HeartIcon,
  RecycleIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
} from "@/components/icons";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const page = getPageBySlug("about");
  const settings = getSettings();
  const siteName = settings.site_name || process.env.SITE_NAME || "";
  return {
    title: page?.meta_title || `About${siteName ? ` ${siteName}` : ""}`,
    description: page?.meta_description || settings.meta_description || `Learn more about us and our mission.`,
  };
}

const defaultFeatures = [
  {
    icon: LeafIcon,
    title: "Sustainability",
    description:
      "Our products are designed with the environment in mind, using renewable materials and responsible manufacturing processes.",
  },
  {
    icon: AwardIcon,
    title: "Innovation",
    description:
      "We invest in research and development to create next-generation products that perform beautifully while protecting our planet.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Quality",
    description:
      "Every product meets the highest standards of quality, durability, and safety — without compromising on design.",
  },
  {
    icon: HeartIcon,
    title: "Service",
    description:
      "From small businesses to large enterprises, we provide dedicated account management and reliable delivery.",
  },
];

const defaultStats = [
  { value: "1,000+", label: "Happy Customers", icon: HeartIcon },
  { value: "500+", label: "Products Delivered", icon: RecycleIcon },
  { value: "50+", label: "Regions Served", icon: LeafIcon },
];

export default async function AboutPage() {
  const settings = getSettings();
  const page = getPageBySlug("about");
  const navItems = getNavigation().map((item) => ({
    label: item.label,
    href: item.href,
  }));

  const features = defaultFeatures;
  const stats = defaultStats;

  return (
    <>
      <SiteHeader navItems={navItems} logo={settings.logo} />
      <main>
        {/* Hero Banner */}
        <section className="relative flex min-h-[400px] items-center bg-[#007A55] px-4 py-20 md:min-h-[480px]">
          <div className="mx-auto max-w-[1280px] text-center">
            <h1 className="mb-4 text-4xl font-extrabold text-white md:text-5xl lg:text-6xl">
              {page?.title || "About Us"}
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-white/90 md:text-xl">
              Our Story
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
            {/* Mission Section */}
            <section className="px-4 py-16 md:py-20">
              <div className="mx-auto max-w-[1280px]">
                <div className="mx-auto max-w-3xl text-center">
                  <h2 className="mb-6 text-3xl font-extrabold text-[#252525] md:text-4xl">
                    Our Mission
                  </h2>
                  <p className="text-lg leading-relaxed text-[#52525C] md:text-xl">
                    We are committed to providing products and services that put
                    customers first. We believe every interaction should be designed
                    with care, delivering value and quality at every touchpoint.
                  </p>
                </div>
              </div>
            </section>

            {/* Why Choose Us */}
            <section className="bg-[#f8f9fa] px-4 py-16 md:py-20">
              <div className="mx-auto max-w-[1280px]">
                <div className="mb-12 text-center">
                  <h2 className="mb-3 text-3xl font-extrabold text-[#252525] md:text-4xl">
                    Why Choose Us
                  </h2>
                  <p className="text-base text-[#52525C] md:text-lg">
                    Four pillars that drive everything we do
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {features.map((feature) => (
                    <div
                      key={feature.title}
                      className="rounded-xl bg-white p-8 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <feature.icon
                        size={40}
                        className="mb-4 text-[#007A55]"
                      />
                      <h3 className="mb-3 text-xl font-bold text-[#252525]">
                        {feature.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-[#52525C]">
                        {feature.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Impact Stats */}
            <section className="px-4 py-16 md:py-20">
              <div className="mx-auto max-w-[1280px]">
                <div className="mb-12 text-center">
                  <h2 className="mb-3 text-3xl font-extrabold text-[#252525] md:text-4xl">
                    Our Impact
                  </h2>
                  <p className="text-base text-[#52525C] md:text-lg">
                    Together with our customers, we&apos;re making a real difference
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
                  {stats.map((stat) => (
                    <div key={stat.label} className="text-center">
                      <stat.icon
                        size={40}
                        className="mx-auto mb-4 text-[#007A55]"
                      />
                      <div className="mb-2 text-4xl font-extrabold text-[#252525] md:text-5xl">
                        {stat.value}
                      </div>
                      <div className="text-base font-medium text-[#52525C]">
                        {stat.label}
                      </div>
                    </div>
                  ))}
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
              Whether you&apos;re a small business or a large enterprise, we&apos;d love
              to help you find the right solution.
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
