import Image from "next/image";
import Link from "next/link";
import { getFooter, getFooterDetails, getHeaderSettings } from "@/lib/site";

export function SiteFooter() {

  const footer = getFooter();
  const footerDetails = getFooterDetails();
  const headerSettings = getHeaderSettings();

  return (
    <footer className="bg-[#05203C] py-16">

      <div className="mx-auto max-w-[980px] px-6 lg:px-0">

        <div className="mb-12 max-w-[600px]">
          <h4 className="mb-6 font-sans text-[18px] font-normal leading-[1.4] text-white">
            {footer.description}
          </h4>
          <Link
            href={`mailto:${footer.email}`}
            className="inline-block border border-[#F26329] px-8 py-3 font-sans text-[14px] uppercase tracking-[0.05em] text-white transition-colors duration-300 hover:bg-[#F26329]"
          >
            {footer.contact_button_label}
          </Link>
        </div>

        <div className="flex flex-col items-end gap-8">

          <Image
            src={headerSettings.logo}
            alt={headerSettings.logo_alt}
            width={272}
            height={72}
            className="h-[72px] w-auto"
          />

          <div className="text-right">

            <h5 className="mb-2 font-sans text-[18px] font-bold uppercase tracking-[0.05em] text-[#F26329]">
              {footer.address}
            </h5>

            <p className="mb-1 font-sans text-[14px] font-bold text-white">
              {footerDetails.location_name}
            </p>

            <p className="whitespace-pre-line font-sans text-[14px] font-light leading-[1.6] text-white">
              {footerDetails.address_line1}{"\n"}
              {footerDetails.address_line2}
            </p>

          </div>

          <p className="font-sans text-[12px] font-light text-white/80">
            {footer.copyright}
          </p>

        </div>

      </div>

    </footer>
  );
}
