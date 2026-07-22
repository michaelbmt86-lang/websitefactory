import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  ShoppingBagIcon,
  ArrowRightIcon,
  MessageCircleIcon,
} from "@/components/icons";

interface HeroSectionProps {
  title?: string;
  subtitle?: string;
  backgroundImage?: string;
}

export function HeroSection({
  title = "Welcome to Our Store",
  subtitle = "Browse our full range of products and solutions. Quality you can trust, delivered to your door.",
  backgroundImage = "/images/hero-bg.jpg",
}: HeroSectionProps) {
  return (
    <section
      className="relative flex min-h-[100vh] items-center bg-cover bg-center"
      style={{ backgroundImage: `url('${backgroundImage}')` }}
    >
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative z-10 mx-auto w-full max-w-3xl px-6 py-20 lg:px-8">
        <h1 className="font-heading text-[36px] font-extrabold leading-[45px] text-white md:text-[48px] md:leading-[60px] lg:text-[60px] lg:leading-[75px]">
          {title}
        </h1>

        <p className="mb-8 max-w-2xl text-[18px] leading-[30px] text-white/90 md:text-[20px] md:leading-[32.5px]">
          {subtitle}
        </p>

        <div className="mb-10 flex flex-wrap gap-4">
          <Link
            href="/products"
            className={cn(
              "inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-[15px] font-semibold",
              "text-[#004F3B] transition-colors hover:bg-white/90"
            )}
          >
            <ShoppingBagIcon size={18} />
            Shop Now
            <ArrowRightIcon size={16} />
          </Link>

          <Link
            href="/contact"
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-5 py-3",
              "text-[15px] font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
            )}
          >
            <MessageCircleIcon size={18} />
            Contact Us
          </Link>
        </div>
      </div>
    </section>
  );
}
