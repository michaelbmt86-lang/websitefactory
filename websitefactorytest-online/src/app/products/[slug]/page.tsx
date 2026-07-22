// ============================================================================
// PRODUCT DETAIL PAGE (Website Factory Framework)
//
// Patterns:
//   - export const dynamic = "force-dynamic" — REQUIRED for DB-dependent routes
//   - Queries product by slug from SQLite
//   - generateMetadata() for per-product SEO
// ============================================================================

import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ArrowRightIcon } from "@/components/icons";
import { getProductBySlug } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return { title: "Product Not Found" };

  return {
    title: product.name,
    description:
      product.short_description || product.description || `View ${product.name}`,
    openGraph: {
      title: product.name,
      description: product.short_description || product.description,
      images: product.image_url ? [{ url: product.image_url }] : [],
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

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
              <span className="font-medium text-[#252525]">{product.name}</span>
            </nav>
          </div>
        </div>

        {/* Product Detail */}
        <section className="px-4 py-12 md:py-16">
          <div className="mx-auto max-w-[1280px]">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
              {/* Image */}
              <div className="flex items-center justify-center rounded-xl bg-[#f8f9fa] p-8">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="max-h-[500px] w-full object-contain"
                  />
                ) : (
                  <div className="flex h-[400px] w-full items-center justify-center rounded-lg bg-gray-100 text-sm text-gray-400">
                    No image available
                  </div>
                )}
              </div>

              {/* Details */}
              <div>
                <div className="mb-4 flex items-center gap-3">
                  {product.is_new === 1 && (
                    <span className="inline-flex rounded-full bg-[#007A55] px-3 py-1 text-xs font-semibold text-white">
                      New
                    </span>
                  )}
                  {product.is_featured === 1 && (
                    <span className="inline-flex rounded-full bg-[#252525] px-3 py-1 text-xs font-semibold text-white">
                      Featured
                    </span>
                  )}
                </div>

                <h1 className="mb-4 text-3xl font-extrabold text-[#252525] md:text-4xl">
                  {product.name}
                </h1>

                <div className="mb-6 flex items-baseline gap-3">
                  <span className="text-3xl font-extrabold text-[#007A55]">
                    ${product.price.toFixed(2)}
                  </span>
                  {product.sale_price && product.sale_price < product.price && (
                    <span className="text-lg text-[#52525C] line-through">
                      ${product.sale_price.toFixed(2)}
                    </span>
                  )}
                </div>

                {product.sku && (
                  <p className="mb-4 text-sm text-[#52525C]">
                    SKU: {product.sku}
                  </p>
                )}

                {product.short_description && (
                  <p className="mb-6 text-lg leading-relaxed text-[#52525C]">
                    {product.short_description}
                  </p>
                )}

                <div className="mb-8 rounded-xl border border-black/5 bg-[#f8f9fa] p-6">
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#252525]">
                    Description
                  </h3>
                  <p className="text-sm leading-relaxed text-[#52525C]">
                    {product.description || "No description available."}
                  </p>
                </div>

                <div className="flex flex-wrap gap-4">
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
                    View All Products
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
