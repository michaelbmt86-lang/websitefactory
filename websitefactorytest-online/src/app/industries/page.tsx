import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getNavigation, getSettings, getCategories } from "@/lib/site";
import {
  ArrowRightIcon,
  UsersIcon,
  ShieldCheckIcon,
  TruckIcon,
} from "@/components/icons";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const settings = getSettings();
  const siteName = settings.site_name || process.env.SITE_NAME || "";
  return {
    title: `Industries${siteName ? ` | ${siteName}` : ""}`,
    description: settings.meta_description || `Industries we serve.`,
  };
}

const trustBadges = [
  {
    icon: UsersIcon,
    value: "10,000+",
    label: "Trusted Customers",
  },
  {
    icon: TruckIcon,
    value: "Next Day",
    label: "Metro Delivery",
  },
  {
    icon: ShieldCheckIcon,
    value: "100%",
    label: "Quality Assured",
  },
];

export default async function IndustriesPage() {
  const settings = getSettings();
  const navItems = getNavigation().map((item) => ({
    label: item.label,
    href: item.href,
  }));

  const categories = getCategories();

  const industries = categories.map((cat) => ({
    title: cat.name,
    description: cat.description,
    slug: cat.slug,
  }));

  return (
    <>
      <SiteHeader navItems={navItems} logo={settings.logo} />
      <main>
        {/* Hero Section */}
        <section className="relative flex min-h-[360px] items-center bg-[#007A55] px-4 py-20 md:min-h-[420px]">
          <div className="mx-auto max-w-[1280px] text-center">
            <h1 className="mb-4 text-4xl font-extrabold text-white md:text-5xl lg:text-6xl">
              Industries We Serve
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-white/90 md:text-xl">
              Solutions for Every Sector
            </p>
          </div>
        </section>

        {/* Industry Cards */}
        <section className="px-4 py-16 md:py-20">
          <div className="mx-auto max-w-[1280px]">
            {industries.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {industries.map((industry) => (
                  <Link
                    key={industry.slug}
                    href={`/industries/${industry.slug}`}
                    className="group rounded-xl border border-black/5 bg-white p-8 transition-all hover:border-[#007A55]/20 hover:shadow-md"
                  >
                    <div className="mb-4 h-1 w-12 rounded-full bg-[#007A55] transition-all group-hover:w-16" />
                    <h3 className="mb-3 text-xl font-bold text-[#252525]">
                      {industry.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-[#52525C]">
                      {industry.description}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-center text-[#52525C]">
                Industries will be populated by the CMS.
              </p>
            )}
          </div>
        </section>

        {/* Trust / Testimonial */}
        <section className="bg-[#f8f9fa] px-4 py-16 md:py-20">
          <div className="mx-auto max-w-[1280px]">
            <div className="mb-12 text-center">
              <h2 className="mb-3 text-3xl font-extrabold text-[#252525] md:text-4xl">
                Trusted by Thousands of Customers
              </h2>
              <p className="text-base text-[#52525C] md:text-lg">
                From small businesses to national enterprises
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
              {trustBadges.map((badge) => (
                <div key={badge.label} className="text-center">
                  <badge.icon
                    size={40}
                    className="mx-auto mb-4 text-[#007A55]"
                  />
                  <div className="mb-2 text-3xl font-extrabold text-[#252525] md:text-4xl">
                    {badge.value}
                  </div>
                  <div className="text-base font-medium text-[#52525C]">
                    {badge.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 py-16 md:py-20">
          <div className="mx-auto max-w-[1280px] text-center">
            <h2 className="mb-4 text-3xl font-extrabold text-[#252525] md:text-4xl">
              Ready to Get Started?
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-[#52525C]">
              Request a free quote or speak with one of our specialists to find
              the right solution for your industry.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-lg bg-[#007A55] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#006145]"
              >
                Contact Us
                <ArrowRightIcon size={16} />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
