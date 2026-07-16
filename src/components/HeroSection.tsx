import { cn } from "@/lib/utils";
import {
  ShoppingBagIcon,
  ArrowRightIcon,
  MessageCircleIcon,
  ShieldCheckIcon,
  TruckIcon,
  UsersIcon,
} from "@/components/icons";

const badges = [
  { icon: ShieldCheckIcon, text: "AS4736 & AS5810 Certified Compostable" },
  { icon: TruckIcon, text: "Next day delivery to metro areas" },
  { icon: UsersIcon, text: "Trusted by 10,000+ venues" },
] as const;

export function HeroSection() {
  return (
    <section className="relative flex min-h-[100vh] items-center bg-[url('/images/hero-bg.jpg')] bg-cover bg-center">
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative z-10 mx-auto w-full max-w-3xl px-6 py-20 lg:px-8">
        <h1 className="font-heading text-[36px] font-extrabold leading-[45px] text-white md:text-[48px] md:leading-[60px] lg:text-[60px] lg:leading-[75px]">
          Quick Service Food Packaging for the Circular World
        </h1>

        <p className="mb-8 max-w-2xl text-[18px] leading-[30px] text-white/90 md:text-[20px] md:leading-[32.5px]">
          Certified compostable ranges, reliable supply, and custom branding —
          shipped Australia-wide.
        </p>

        <div className="mb-10 flex flex-wrap gap-4">
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-[15px] font-semibold",
              "text-[#004F3B] transition-colors hover:bg-white/90"
            )}
          >
            <ShoppingBagIcon size={18} />
            Shop Sale
            <ArrowRightIcon size={16} />
          </button>

          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-5 py-3",
              "text-[15px] font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
            )}
          >
            <MessageCircleIcon size={18} />
            Request Custom Quote
          </button>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-3">
          {badges.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2 text-[14px] text-white">
              <span
                className="inline-block size-2 shrink-0 rounded-full"
                style={{ backgroundColor: "rgb(168, 205, 54)" }}
              />
              <Icon size={16} className="text-white/70" />
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
