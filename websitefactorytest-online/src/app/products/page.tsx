import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getNavigation, getCategories, getFeaturedProducts, getSettings } from "@/lib/site";
import {
  ArrowRightIcon,
} from "@/components/icons";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const settings = getSettings();
  const siteName = settings.site_name || process.env.SITE_NAME || "";
  return {
    title: `Products${siteName ? ` | ${siteName}` : ""}`,
    description: settings.meta_description || `Browse our full range of products.`,
  };
}

export default function ProductsPage() {
  const settings = getSettings();
  const navItems = getNavigation().map((item) => ({
    label: item.label,
    href: item.href,
  }));

  const categories = getCategories();
  const featuredProducts = getFeaturedProducts();

  return (
    <>
      <SiteHeader navItems={navItems} logo={settings.logo} />
      <main>
        {/* Hero Section */}
        <section className="relative flex min-h-[360px] items-center bg-[#007A55] px-4 py-20 md:min-h-[420px]">
          <div className="mx-auto max-w-[1280px] text-center">
            <h1 className="mb-4 text-4xl font-extrabold text-white md:text-5xl lg:text-6xl">
              Our Products
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-white/90 md:text-xl">
              Browse Our Full Range
            </p>
          </div>
        </section>

        {/* Category Cards */}
        {categories.length > 0 && (
          <section className="px-4 py-16 md:py-20">
            <div className="mx-auto max-w-[1280px]">
              <div className="mb-12 text-center">
                <h2 className="mb-3 text-3xl font-extrabold text-[#252525] md:text-4xl">
                  Shop by Category
                </h2>
                <p className="text-base text-[#52525C] md:text-lg">
                  Discover our full range of products
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((category) => (
                  <Link
                    key={category.slug}
                    href={`/categories/${category.slug}`}
                    className="group flex flex-col rounded-xl border border-black/5 bg-white p-8 transition-all hover:border-[#007A55]/20 hover:shadow-md"
                  >
                    <h3 className="mb-2 text-xl font-bold text-[#252525]">
                      {category.name}
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
        )}

        {/* Featured Products */}
        {featuredProducts.length > 0 && (
          <section className="bg-[#f8f9fa] px-4 py-16 md:py-20">
            <div className="mx-auto max-w-[1280px]">
              <div className="mb-12 text-center">
                <h2 className="mb-3 text-3xl font-extrabold text-[#252525] md:text-4xl">
                  Featured Products
                </h2>
                <p className="text-base text-[#52525C] md:text-lg">
                  Our most popular products
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {featuredProducts.map((product) => (
                  <Link
                    key={product.slug}
                    href={`/products/${product.slug}`}
                    className="group rounded-xl bg-white p-6 shadow-sm transition-all hover:shadow-md"
                  >
                    <h3 className="mb-2 text-lg font-bold text-[#252525] group-hover:text-[#007A55]">
                      {product.name}
                    </h3>
                    <p className="mb-4 text-sm leading-relaxed text-[#52525C]">
                      {product.short_description || product.description}
                    </p>
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#007A55] transition-all group-hover:gap-3">
                      View Product <ArrowRightIcon size={16} />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="px-4 py-16 md:py-20">
          <div className="mx-auto max-w-[1280px] text-center">
            <h2 className="mb-4 text-3xl font-extrabold text-[#252525] md:text-4xl">
              Can&apos;t Find What You&apos;re Looking For?
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-[#52525C]">
              Get in touch and let us help you find the right solution.
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
