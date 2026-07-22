"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";

interface Category {
  name: string;
  slug: string;
  description: string;
  image_url: string;
}

const defaultCategories: Category[] = [];

export function CategoryGrid({ categories }: { categories?: Category[] }) {
  const items = categories && categories.length > 0 ? categories : defaultCategories;

  if (items.length === 0) return null;

  return (
    <section className="py-16">
      <div className="mx-auto max-w-[1280px] px-4">
        <div className="mb-12 text-center">
          <h2 className="mb-2 text-3xl font-extrabold text-[rgb(37,37,37)] md:text-[36px]">
            Shop by Category
          </h2>
          <p className="text-base text-[rgb(82,82,92)] md:text-lg">
            Browse our range of products
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 md:gap-6">
          {items.map((category) => (
            <Link
              key={category.slug}
              href={`/categories/${category.slug}`}
              className="group relative block aspect-[3/4] overflow-hidden rounded-xl"
            >
              <Image
                src={category.image_url}
                alt={category.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="mb-1 text-2xl font-bold">{category.name}</h3>
                <p className="mb-4 text-sm opacity-90">{category.description}</p>
                <span className="inline-flex items-center gap-2 text-sm font-semibold transition-all duration-300 group-hover:gap-3">
                  Browse <ArrowRightIcon size={16} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
