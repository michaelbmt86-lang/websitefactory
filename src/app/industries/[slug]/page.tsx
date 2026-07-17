import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ArrowRightIcon } from "@/components/icons";

const KNOWN_INDUSTRIES: Record<
  string,
  { title: string; description: string; features: string[] }
> = {
  "cafes-restaurants": {
    title: "Cafes & Restaurants",
    description:
      "From single-location cafes to restaurant groups, our certified compostable cups, containers, and cutlery help you serve sustainably without sacrificing quality or design.",
    features: [
      "Hot cups, cold cups & lids",
      "Takeaway containers & clamshells",
      "Wooden & CPLA cutlery",
      "Napkins & table accessories",
      "Custom branding available",
    ],
  },
  "quick-service-restaurants": {
    title: "Quick Service Restaurants",
    description:
      "Purpose-built ranges for high-volume QSR operations. Reliable supply, fast delivery, and custom branding options to match your brand at scale.",
    features: [
      "High-volume packaging solutions",
      "Consistent supply & next-day delivery",
      "Custom printed cups & bags",
      "Compliance with plastic bans",
      "Volume pricing & account management",
    ],
  },
  "corporate-catering": {
    title: "Corporate Catering",
    description:
      "Elevate your catering presentation with premium compostable plates, platters, and utensils. Perfect for boardroom lunches to large corporate events.",
    features: [
      "Premium compostable plates & platters",
      "Individually wrapped cutlery sets",
      "Napkins & tableware",
      "Event-ready bulk packs",
      "Branded packaging options",
    ],
  },
  "events-festivals": {
    title: "Events & Festivals",
    description:
      "Single-use plastic bans are here to stay. Our wide range of compostable serviceware keeps your event clean, compliant, and environmentally responsible.",
    features: [
      "Large-volume supply capacity",
      "Compliant with plastic bans",
      "Compostable food containers & bowls",
      "Napkins, plates & cutlery",
      "Sustainability signage support",
    ],
  },
  "retail-grocery": {
    title: "Retail & Grocery",
    description:
      "Compostable bags, deli containers, and food-safe packaging for butchers, bakeries, delis, and grocery retailers looking to eliminate plastic.",
    features: [
      "Compostable carry bags",
      "Deli containers & produce bags",
      "Bakery boxes & wraps",
      "Meat trays & food-safe packaging",
      "Sustainability signage",
    ],
  },
  "education-universities": {
    title: "Education & Universities",
    description:
      "Help campuses go plastic-free with affordable, certified compostable takeaway packaging for canteens, food courts, and student venues.",
    features: [
      "Affordable compostable packaging",
      "Cups, containers & cutlery",
      "Bulk packs for campus food courts",
      "Student-friendly branding",
      "Waste reduction support",
    ],
  },
};

function slugToIndustryName(slug: string): string {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// generateStaticParams with hardcoded data — use this pattern for routes with
// known, static slugs. For DB-dependent routes, use force-dynamic instead.
export async function generateStaticParams() {
  return Object.keys(KNOWN_INDUSTRIES).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const industry = KNOWN_INDUSTRIES[slug];
  const name = industry?.title || slugToIndustryName(slug);

  return {
    title: `${name} | BioPak Packaging Solutions`,
    description:
      industry?.description ||
      `Sustainable compostable packaging solutions for the ${name} industry from BioPak Australia.`,
  };
}

export default async function IndustryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const industry = KNOWN_INDUSTRIES[slug];
  const name = industry?.title || slugToIndustryName(slug);
  const description =
    industry?.description ||
    `Sustainable compostable packaging solutions tailored for the ${name} industry.`;
  const features = industry?.features || [
    "Certified compostable packaging",
    "Custom branding options",
    "Next-day metro delivery",
    "Volume pricing available",
    "Dedicated account management",
  ];

  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="relative flex min-h-[360px] items-center bg-[#007A55] px-4 py-20 md:min-h-[420px]">
          <div className="mx-auto max-w-[1280px] text-center">
            <h1 className="mb-4 text-4xl font-extrabold text-white md:text-5xl lg:text-6xl">
              {name}
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-white/90 md:text-xl">
              Sustainable Packaging Solutions
            </p>
          </div>
        </section>

        {/* Overview */}
        <section className="px-4 py-16 md:py-20">
          <div className="mx-auto max-w-[1280px]">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="mb-6 text-3xl font-extrabold text-[#252525] md:text-4xl">
                How BioPak Serves {name}
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
                Everything your business needs to go sustainable
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

        {/* CTA */}
        <section className="px-4 py-16 md:py-20">
          <div className="mx-auto max-w-[1280px] text-center">
            <h2 className="mb-4 text-3xl font-extrabold text-[#252525] md:text-4xl">
              Ready to Go Sustainable?
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-[#52525C]">
              Request a free quote or speak with one of our packaging specialists
              to find the right solution for your {name.toLowerCase()} business.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-lg bg-[#007A55] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#006145]"
              >
                Request a Quote
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
