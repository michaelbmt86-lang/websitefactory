import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import {
  LeafIcon,
  AwardIcon,
  HeartIcon,
  RecycleIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
} from "@/components/icons";

export const metadata = {
  title: "About BioPak | A World Without Waste",
  description:
    "Learn about BioPak's mission to provide sustainable packaging solutions that put the planet first. B Corp Certified and committed to a world without waste.",
};

const features = [
  {
    icon: LeafIcon,
    title: "Sustainability",
    description:
      "Our products are made from renewable plant-based materials and are certified compostable, returning to the earth when disposed of correctly.",
  },
  {
    icon: AwardIcon,
    title: "Innovation",
    description:
      "We invest in research and development to create next-generation packaging that performs beautifully while protecting our planet.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Quality",
    description:
      "Every BioPak product meets the highest standards of quality, durability, and food safety — without compromising on design.",
  },
  {
    icon: HeartIcon,
    title: "Service",
    description:
      "From small cafes to large QSR chains, we provide dedicated account management and next-day metro delivery across Australia.",
  },
];

const stats = [
  { value: "210,630", label: "Trees Planted", icon: LeafIcon },
  { value: "1,024,389", label: "Meals Donated", icon: HeartIcon },
  { value: "550,000", label: "Lives Impacted", icon: RecycleIcon },
];

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero Banner */}
        <section className="relative flex min-h-[400px] items-center bg-[#007A55] px-4 py-20 md:min-h-[480px]">
          <div className="mx-auto max-w-[1280px] text-center">
            <h1 className="mb-4 text-4xl font-extrabold text-white md:text-5xl lg:text-6xl">
              About BioPak
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-white/90 md:text-xl">
              A World Without Waste
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="px-4 py-16 md:py-20">
          <div className="mx-auto max-w-[1280px]">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="mb-6 text-3xl font-extrabold text-[#252525] md:text-4xl">
                Our Mission
              </h2>
              <p className="text-lg leading-relaxed text-[#52525C] md:text-xl">
                Our mission is to provide sustainable packaging solutions that
                put the planet first. We believe that every piece of packaging
                should be designed with its end-of-life in mind — returning to
                the earth through composting, not polluting it as landfill waste.
              </p>
            </div>
          </div>
        </section>

        {/* Why Choose BioPak */}
        <section className="bg-[#f8f9fa] px-4 py-16 md:py-20">
          <div className="mx-auto max-w-[1280px]">
            <div className="mb-12 text-center">
              <h2 className="mb-3 text-3xl font-extrabold text-[#252525] md:text-4xl">
                Why Choose BioPak
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

        {/* B Corp / Company Section */}
        <section className="bg-[#f8f9fa] px-4 py-16 md:py-20">
          <div className="mx-auto max-w-[1280px]">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#007A55]/10 px-4 py-2">
                <AwardIcon size={20} className="text-[#007A55]" />
                <span className="text-sm font-semibold text-[#007A55]">
                  B Corp Certified
                </span>
              </div>
              <h2 className="mb-6 text-3xl font-extrabold text-[#252525] md:text-4xl">
                A Business as a Force for Good
              </h2>
              <p className="mb-6 text-lg leading-relaxed text-[#52525C]">
                BioPak is proud to be a certified B Corporation, meeting the
                highest standards of verified social and environmental
                performance, transparency, and accountability. As a B Corp, we
                balance purpose and profit — considering the impact of our
                decisions on our workers, customers, suppliers, community, and the
                environment.
              </p>
              <p className="text-lg leading-relaxed text-[#52525C]">
                We were founded in 2006 with a simple but powerful idea: food
                packaging should be designed for the circular economy. Today, we
                are Australia&apos;s leading provider of certified compostable food
                service packaging, serving thousands of venues from cafes to
                national quick-service restaurant chains.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 py-16 md:py-20">
          <div className="mx-auto max-w-[1280px] text-center">
            <h2 className="mb-4 text-3xl font-extrabold text-[#252525] md:text-4xl">
              Ready to Make a Difference?
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-[#52525C]">
              Whether you&apos;re a small cafe or a national chain, we&apos;d love
              to help you transition to sustainable packaging.
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
