import Image from "next/image";
import { getBenefits, getTechnologySection } from "@/lib/site";

function CornerAccent({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 113 104"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        strokeWidth="1.5"
        stroke="#F26329"
        d="M112 1H21.5C12 1 1 7.5 1 22v80.5"
        fill="none"
      />
    </svg>
  );
}

function BenefitCard({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="relative flex flex-col items-start gap-3 p-4">
      <CornerAccent className="absolute right-0 top-0 h-[60px] w-[60px]" />
      <Image src={icon} alt="" width={50} height={50} className="h-[50px] w-[50px]" />
      <h6 className="whitespace-pre-line font-sans text-[14px] font-light leading-[1.6] text-white">
        {title}
      </h6>
    </div>
  );
}

export function TechnologySection() {
  const benefits = getBenefits();
  const tech = getTechnologySection();
  return (
    <section
      id="technology"
      className="relative overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(rgba(5, 53, 88, 0) 4.37%, rgba(5, 32, 60, 0.21) 19.3%, rgb(5, 32, 60) 53.5%), url(/images/www.solidhydrogen.tech/bg-technology.png)`,
        backgroundSize: "cover",
        backgroundPosition: "center top",
      }}
    >
      <div className="mx-auto max-w-[980px] px-6 py-16 lg:px-0 lg:py-24">
        <div className="mb-16 grid gap-12 lg:grid-cols-2">
          <div>
            <h5 className="mb-6 font-sans text-[17px] font-normal uppercase leading-[22.1px] tracking-[-0.34px] text-[#F26329]">
              {tech.heading}
            </h5>
            <h6 className="font-sans text-[20px] font-light leading-[26px] tracking-[-0.2px] text-[#05203C]">
              <span className="font-bold">{tech.paragraph1_label}</span>
              <span>
                {" "}
                {tech.paragraph1_body}
              </span>
              <br />
              <br />
              <span className="font-bold">{tech.paragraph2_label}</span>
              <span>
                {" "}
                {tech.paragraph2_body}
              </span>
            </h6>
          </div>
        </div>

        <div id="benefits" className="mb-12">
          <h1 className="mb-8 font-sans text-[32px] font-bold leading-[50px] tracking-[-1px] text-[#05203C] md:text-[42px] lg:text-[50px]">
            {tech.benefits_heading}
          </h1>
          <h5 className="mb-10 font-sans text-[18px] font-bold uppercase tracking-[0.05em] text-[#F26329]">
            {tech.benefits_subheading}
          </h5>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit) => (
              <BenefitCard key={benefit.title} icon={benefit.icon} title={benefit.title} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
