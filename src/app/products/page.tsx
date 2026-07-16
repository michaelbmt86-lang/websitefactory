import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import {
  LeafIcon,
  ArrowRightIcon,
  RecycleIcon,
  ShieldCheckIcon,
} from "@/components/icons";

export const metadata = {
  title: "Our Products | BioPak Sustainable Packaging",
  description:
    "Explore BioPak's range of certified compostable food service packaging — from hot cups and food containers to cutlery, bags, and more.",
};

const categories = [
  {
    title: "Drinks",
    description: "Cups, lids & straws for hot and cold beverages",
    href: "/cups",
    icon: LeafIcon,
  },
  {
    title: "Food Packaging",
    description: "Containers, bowls, clamshells & sauce cups",
    href: "/containers-lids",
    icon: RecycleIcon,
  },
  {
    title: "Service & Accessories",
    description: "Cutlery, napkins, gloves & hygiene essentials",
    href: "/napkins-washroom",
    icon: ShieldCheckIcon,
  },
  {
    title: "Bags & Carry",
    description: "Paper bags, carry bags & retail packaging",
    href: "/bags",
    icon: LeafIcon,
  },
  {
    title: "Kits",
    description: "Retail & catering packs for every occasion",
    href: "/cutlery-straws",
    icon: RecycleIcon,
  },
  {
    title: "Plates & Trays",
    description: "Compostable plates, trays & serveware",
    href: "/plates-trays",
    icon: ShieldCheckIcon,
  },
];

const featuredProducts = [
  {
    name: "Single Wall Hot Cups",
    description:
      "Ideal for serving coffee and tea. Made from FSC-certified paper with a PLA plant-based lining. Available in 6oz, 8oz, 10oz, 12oz and 16oz.",
    category: "Drinks",
    href: "/cups/single-wall",
  },
  {
    name: "Double Wall Hot Cups",
    description:
      "No sleeve needed. Double wall construction provides superior insulation for hot drinks. Premium feel for your coffee service.",
    category: "Drinks",
    href: "/cups/double-wall",
  },
  {
    name: "BioCane Bowls",
    description:
      "Made from sugarcane pulp (bagasse), these bowls are microwave and freezer safe. Perfect for soups, salads and grain bowls.",
    category: "Food Packaging",
    href: "/containers-lids/bowls",
  },
  {
    name: "Wooden Cutlery",
    description:
      "FSC-certified birchwood cutlery that is commercially compostable. Strong, smooth finish and naturally biodegradable.",
    category: "Service & Accessories",
    href: "/cutlery-straws",
  },
  {
    name: "Paper Straws",
    description:
      "FSC-certified paper straws in a range of colours. Long-lasting and certified compostable — no more plastic straws.",
    category: "Service & Accessories",
    href: "/cutlery-straws",
  },
  {
    name: "Compostable Bags",
    description:
      "Certified compostable bin liners and carry bags made from corn starch. Break down fully in commercial composting facilities.",
    category: "Bags & Carry",
    href: "/bags",
  },
];

export default function ProductsPage() {
  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero Section */}
        <section className="relative flex min-h-[360px] items-center bg-[#007A55] px-4 py-20 md:min-h-[420px]">
          <div className="mx-auto max-w-[1280px] text-center">
            <h1 className="mb-4 text-4xl font-extrabold text-white md:text-5xl lg:text-6xl">
              Our Products
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-white/90 md:text-xl">
              Sustainable Packaging for Every Need
            </p>
          </div>
        </section>

        {/* Category Cards */}
        <section className="px-4 py-16 md:py-20">
          <div className="mx-auto max-w-[1280px]">
            <div className="mb-12 text-center">
              <h2 className="mb-3 text-3xl font-extrabold text-[#252525] md:text-4xl">
                Shop by Category
              </h2>
              <p className="text-base text-[#52525C] md:text-lg">
                Discover our full range of sustainable packaging solutions
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <Link
                  key={category.href}
                  href={category.href}
                  className="group flex flex-col rounded-xl border border-black/5 bg-white p-8 transition-all hover:border-[#007A55]/20 hover:shadow-md"
                >
                  <category.icon
                    size={36}
                    className="mb-4 text-[#007A55]"
                  />
                  <h3 className="mb-2 text-xl font-bold text-[#252525]">
                    {category.title}
                  </h3>
                  <p className="mb-4 flex-1 text-sm text-[#52525C]">
                    {category.description}
                  </p>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#007A55] transition-all group-hover:gap-3">
                    Learn More <ArrowRightIcon size={16} />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="bg-[#f8f9fa] px-4 py-16 md:py-20">
          <div className="mx-auto max-w-[1280px]">
            <div className="mb-12 text-center">
              <h2 className="mb-3 text-3xl font-extrabold text-[#252525] md:text-4xl">
                Featured Products
              </h2>
              <p className="text-base text-[#52525C] md:text-lg">
                Our most popular certified compostable products
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredProducts.map((product) => (
                <Link
                  key={product.name}
                  href={product.href}
                  className="group rounded-xl bg-white p-6 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="mb-3 inline-flex rounded-full bg-[#007A55]/10 px-3 py-1">
                    <span className="text-xs font-semibold text-[#007A55]">
                      {product.category}
                    </span>
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-[#252525] group-hover:text-[#007A55]">
                    {product.name}
                  </h3>
                  <p className="mb-4 text-sm leading-relaxed text-[#52525C]">
                    {product.description}
                  </p>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#007A55] transition-all group-hover:gap-3">
                    View Product <ArrowRightIcon size={16} />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 py-16 md:py-20">
          <div className="mx-auto max-w-[1280px] text-center">
            <h2 className="mb-4 text-3xl font-extrabold text-[#252525] md:text-4xl">
              Can&apos;t Find What You&apos;re Looking For?
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-[#52525C]">
              We offer custom packaging solutions tailored to your brand. Get in
              touch and let&apos;s create something sustainable together.
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
                href="/contact"
                className="inline-flex items-center gap-2 rounded-lg border border-[#007A55] px-6 py-3 text-sm font-semibold text-[#007A55] transition-colors hover:bg-[#007A55]/5"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
