import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import {
  ArrowRightIcon,
  UsersIcon,
  ShieldCheckIcon,
  TruckIcon,
} from "@/components/icons";

export const metadata = {
  title: "Industries We Serve | BioPak Packaging Solutions",
  description:
    "BioPak provides sustainable compostable packaging for cafes, restaurants, QSR chains, catering, events, retail, and education across Australia.",
};

const industries = [
  {
    title: "Cafes & Restaurants",
    description:
      "From single-location cafes to restaurant groups, our certified compostable cups, containers, and cutlery help you serve sustainably without sacrificing quality or design.",
  },
  {
    title: "Quick Service Restaurants",
    description:
      "Purpose-built ranges for high-volume QSR operations. Reliable supply, fast delivery, and custom branding options to match your brand at scale.",
  },
  {
    title: "Corporate Catering",
    description:
      "Elevate your catering presentation with premium compostable plates, platters, and utensils. Perfect for boardroom lunches to large corporate events.",
  },
  {
    title: "Events & Festivals",
    description:
      "Single-use plastic bans are here to stay. Our wide range of compostable serviceware keeps your event clean, compliant, and environmentally responsible.",
  },
  {
    title: "Retail & Grocery",
    description:
      "Compostable bags, deli containers, and food-safe packaging for butchers, bakeries, delis, and grocery retailers looking to eliminate plastic.",
  },
  {
    title: "Education & Universities",
    description:
      "Help campuses go plastic-free with affordable, certified compostable takeaway packaging for canteens, food courts, and student venues.",
  },
];

const trustBadges = [
  {
    icon: UsersIcon,
    value: "10,000+",
    label: "Trusted Venues",
  },
  {
    icon: TruckIcon,
    value: "Next Day",
    label: "Metro Delivery",
  },
  {
    icon: ShieldCheckIcon,
    value: "100%",
    label: "Certified Compostable",
  },
];

export default function IndustriesPage() {
  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero Section */}
        <section className="relative flex min-h-[360px] items-center bg-[#007A55] px-4 py-20 md:min-h-[420px]">
          <div className="mx-auto max-w-[1280px] text-center">
            <h1 className="mb-4 text-4xl font-extrabold text-white md:text-5xl lg:text-6xl">
              Industries We Serve
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-white/90 md:text-xl">
              Packaging Solutions for Every Sector
            </p>
          </div>
        </section>

        {/* Industry Cards */}
        <section className="px-4 py-16 md:py-20">
          <div className="mx-auto max-w-[1280px]">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {industries.map((industry) => (
                <div
                  key={industry.title}
                  className="rounded-xl border border-black/5 bg-white p-8 transition-all hover:border-[#007A55]/20 hover:shadow-md"
                >
                  <div className="mb-4 h-1 w-12 rounded-full bg-[#007A55]" />
                  <h3 className="mb-3 text-xl font-bold text-[#252525]">
                    {industry.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-[#52525C]">
                    {industry.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust / Testimonial */}
        <section className="bg-[#f8f9fa] px-4 py-16 md:py-20">
          <div className="mx-auto max-w-[1280px]">
            <div className="mb-12 text-center">
              <h2 className="mb-3 text-3xl font-extrabold text-[#252525] md:text-4xl">
                Trusted by 10,000+ Venues Across Australia
              </h2>
              <p className="text-base text-[#52525C] md:text-lg">
                From neighbourhood cafes to national QSR chains
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

            {/* Testimonial */}
            <div className="mx-auto mt-12 max-w-3xl rounded-xl bg-white p-8 shadow-sm md:p-12">
              <blockquote className="text-center">
                <p className="mb-6 text-lg italic leading-relaxed text-[#52525C] md:text-xl">
                  &ldquo;Switching to BioPak was one of the easiest and most
                  impactful decisions we&apos;ve made. Our customers love knowing
                  their takeaway packaging will compost, not end up in landfill.
                  The quality is outstanding and next-day delivery keeps our
                  shelves stocked.&rdquo;
                </p>
                <footer>
                  <div className="text-base font-bold text-[#252525]">
                    Sarah Mitchell
                  </div>
                  <div className="text-sm text-[#52525C]">
                    Operations Manager, Greenleaf Cafe Group
                  </div>
                </footer>
              </blockquote>
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
              to find the right sustainable solution for your industry.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-lg bg-[#007A55] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#006145]"
              >
                Request a Quote
                <ArrowRightIcon size={16} />
              </Link>
              <a
                href="tel:1300246725"
                className="inline-flex items-center gap-2 rounded-lg border border-[#007A55] px-6 py-3 text-sm font-semibold text-[#007A55] transition-colors hover:bg-[#007A55]/5"
              >
                Call 1300 246 725
              </a>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
