import { LeafIcon, TruckIcon, UsersIcon, RecycleIcon } from "@/components/icons";

const valueProps = [
  {
    title: "Quality Products",
    description:
      "We offer products that meet the highest standards of quality and reliability.",
    icon: LeafIcon,
  },
  {
    title: "Fast Delivery",
    description:
      "Quick and reliable delivery to get your products to you when you need them.",
    icon: TruckIcon,
  },
  {
    title: "Customer Support",
    description:
      "Dedicated support team ready to help with any questions or requirements.",
    icon: UsersIcon,
  },
  {
    title: "Sustainable Practices",
    description:
      "Committed to responsible sourcing and environmentally conscious operations.",
    icon: RecycleIcon,
  },
];

export function ValueProps() {
  return (
    <section className="px-4 py-16 md:px-4 lg:px-4">
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {valueProps.map((prop) => (
          <div key={prop.title} className="flex flex-col gap-4">
            <prop.icon
              size={60}
              className="text-[#007A55]"
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
