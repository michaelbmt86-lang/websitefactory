import Image from "next/image";

const valueProps = [
  {
    title: "Packaging Made From Plants",
    description:
      "Designed for the circular economy where resources are reused and not wasted.",
    icon: "/images/value-props/packaging-from-plants.png",
  },
  {
    title: "Certified Compostable",
    description:
      "We champion composting as the best recycling solution for food packaging.",
    icon: "/images/value-props/certified-compostable.png",
  },
  {
    title: "B Corp Certified",
    description:
      "We give back to people and planet, so your purchases directly affect positive change.",
    icon: "/images/value-props/b-corp.png",
  },
  {
    title: "Emissions Reduction",
    description:
      "We have a roadmap in place to reduce our carbon emissions in our supply chain and operations.",
    icon: "/images/value-props/emissions-reduction.png",
  },
];

export function ValueProps() {
  return (
    <section className="px-4 py-16 md:px-4 lg:px-4">
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {valueProps.map((prop) => (
          <div key={prop.title} className="flex flex-col gap-4">
            <Image
              src={prop.icon}
              alt={prop.title}
              width={60}
              height={60}
              className="h-[60px] w-[60px] object-contain"
            />
            <h3 className="font-sans text-[16px] font-bold leading-[24px] text-[rgb(37,37,37)]">
              {prop.title}
            </h3>
            <p className="font-sans text-[14px] leading-[22px] text-[rgb(82,82,92)]">
              {prop.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
