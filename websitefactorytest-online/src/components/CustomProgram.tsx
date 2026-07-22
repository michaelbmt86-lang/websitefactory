import Image from "next/image";
import Link from "next/link";

const customData = {
  badge: "Custom Program",
  title: "Build Your Brand with Custom Solutions",
  description:
    "Stand out with fully customised solutions tailored to your business. From design to delivery, we handle everything so you can focus on your business.",
  features: [
    {
      title: "Full Design Service",
      description: "Expert design team to bring your brand vision to life",
    },
    {
      title: "Dedicated Account Manager",
      description: "Personal support throughout your project",
    },
  ],
  primaryCta: { label: "Request Custom Quote", href: "/contact" },
  secondaryCta: {
    label: "View Our Range",
    href: "/products",
  },
  stats: { number: "500+", label: "Projects Completed" },
  image: "/images/hero-bg.jpg",
};

export function CustomProgram() {
  return (
    <section className="mx-auto flex max-w-[1280px] flex-col items-center gap-16 px-4 py-20 md:flex-row md:gap-16 md:px-4 md:py-20 lg:gap-[64px] lg:px-4 lg:py-[80px]">
      <div className="flex-1">
        <span className="mb-4 inline-block rounded-full bg-[rgba(0,122,85,0.1)] px-3 py-1.5 text-sm font-semibold text-[#007A55] md:mb-4">
          {customData.badge}
        </span>

        <h2 className="mb-4 text-[36px] font-extrabold leading-[1.2] text-[#252525] md:mb-4 md:text-[36px]">
          {customData.title}
        </h2>

        <p className="mb-6 text-base leading-[26px] text-[#52525C] md:mb-6">
          {customData.description}
        </p>

        <div className="mb-8 flex flex-col gap-4 md:mb-8">
          {customData.features.map((feature) => (
            <div key={feature.title} className="flex gap-3">
              <div>
                <h3 className="text-base font-semibold text-[#252525]">
                  {feature.title}
                </h3>
                <p className="text-sm text-[#52525C]">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-4">
          <Link
            href={customData.primaryCta.href}
            className="rounded-lg bg-[#007A55] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#006848]"
          >
            {customData.primaryCta.label}
          </Link>
          <Link
            href={customData.secondaryCta.href}
            className="rounded-lg border border-[#007A55] bg-transparent px-6 py-3 font-semibold text-[#007A55] transition-colors hover:bg-[rgba(0,122,85,0.05)]"
          >
            {customData.secondaryCta.label}
          </Link>
        </div>
      </div>

      <div className="relative w-full flex-[0.67] md:w-auto">
        <div className="absolute left-[-20px] top-[-20px] rounded-xl bg-[#007A55] px-6 py-6 text-center text-white md:left-[-20px] md:top-[-20px]">
          <div className="text-[48px] font-extrabold">{customData.stats.number}</div>
          <div className="text-sm">{customData.stats.label}</div>
        </div>

        <Image
          src={customData.image}
          alt="Custom solutions example"
          width={600}
          height={400}
          className="w-full rounded-2xl object-cover"
        />
      </div>
    </section>
  );
}
