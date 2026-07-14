import Link from "next/link";
import { getTechnologySection } from "@/lib/site";

export function CtaBanner() {
  const tech = getTechnologySection();

  return (
    <section className="bg-[#F26329] py-6">
      <div className="mx-auto flex max-w-[980px] items-center justify-center px-6 py-4 text-center lg:px-0">
        <Link
          href={`mailto:${tech.cta_email}`}
          className="font-sans text-[24px] font-normal leading-[33.6px] text-white no-underline"
        >
          <span className="underline">{tech.cta_prefix}</span>
          {" "}
          <span>{tech.cta_suffix}</span>
        </Link>
      </div>
    </section>
  );
}
