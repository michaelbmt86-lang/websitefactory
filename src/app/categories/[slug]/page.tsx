import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ArrowRightIcon } from "@/components/icons";
import {
  getCategoryBySlug,
  getAllCategorySlugs,
  getProductsByCategory,
} from "@/lib/site";

export async function generateStaticParams() {
  const slugs = getAllCategorySlugs();
  return slugs.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) return { title: "Category Not Found" };

  return {
    title: `${category.name} | BioPak Sustainable Packaging`,
    description:
      category.description ||
      `Browse BioPak's range of ${category.name} — certified compostable packaging solutions.`,
  };
}

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const products = getProductsByCategory(category.id);

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
                href="/products"
                className="transition-colors hover:text-[#007A55]"
              >
                Products
              </Link>
              <span>/</span>
              <span className="font-medium text-[#252525]">
                {category.name}
              </span>
            </nav>
          </div>
        </div>

        {/* Hero */}
        <section className="relative flex min-h-[300px] items-center bg-[#007A55] px-4 py-16 md:min-h-[360px]">
          <div className="mx-auto max-w-[1280px] text-center">
            <h1 className="mb-4 text-4xl font-extrabold text-white md:text-5xl lg:text-6xl">
              {category.name}
            </h1>
            {category.description && (
              <p className="mx-auto max-w-2xl text-lg text-white/90 md:text-xl">
                {category.description}
              </p>
            )}
          </div>
        </section>

        {/* Products Grid */}
        <section className="px-4 py-16 md:py-20">
          <div className="mx-auto max-w-[1280px]">
            {products.length === 0 ? (
              <div className="text-center">
                <h2 className="mb-4 text-2xl font-bold text-[#252525]">
                  Coming Soon
                </h2>
                <p className="mb-8 text-[#52525C]">
                  Products in this category are being added. Check back soon!
                </p>
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#007A55] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#006145]"
                >
                  Browse All Products
                  <ArrowRightIcon size={16} />
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-8 text-center">
                  <h2 className="mb-3 text-3xl font-extrabold text-[#252525] md:text-4xl">
                    {category.name}
                  </h2>
                  <p className="text-base text-[#52525C] md:text-lg">
                    {products.length} product{products.length !== 1 ? "s" : ""}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {products.map((product) => (
                    <Link
                      key={product.slug}
                      href={`/products/${product.slug}`}
                      className="group rounded-xl bg-white p-6 shadow-sm transition-all hover:shadow-md"
                    >
                      {product.image_url ? (
                        <div className="mb-4 flex h-[200px] items-center justify-center rounded-lg bg-[#f8f9fa]">
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="max-h-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="mb-4 flex h-[200px] items-center justify-center rounded-lg bg-[#f8f9fa] text-sm text-gray-400">
                          No image
                        </div>
                      )}

                      <div className="mb-2 flex items-center gap-2">
                        {product.is_new === 1 && (
                          <span className="rounded-full bg-[#007A55] px-2 py-0.5 text-[10px] font-semibold text-white">
                            New
                          </span>
                        )}
                        {product.is_featured === 1 && (
                          <span className="rounded-full bg-[#252525] px-2 py-0.5 text-[10px] font-semibold text-white">
                            Featured
                          </span>
                        )}
                      </div>

                      <h3 className="mb-2 text-lg font-bold text-[#252525] group-hover:text-[#007A55]">
                        {product.name}
                      </h3>
                      <p className="mb-4 text-sm leading-relaxed text-[#52525C] line-clamp-2">
                        {product.short_description || product.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <span className="text-lg font-extrabold text-[#007A55]">
                          ${product.price.toFixed(2)}
                        </span>
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#007A55] transition-all group-hover:gap-2">
                          View <ArrowRightIcon size={14} />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
