import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getNavigation, getHeaderSettings } from "@/lib/site";

export function SiteHeader() {

  const navigation = getNavigation();
  const settings = getHeaderSettings();

  return (
    <header className="sticky top-0 z-[52] h-[106px] w-full bg-transparent">

      <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between px-6 lg:px-12">

        <Link href="/" className="shrink-0">

          <Image
            src={settings.logo}
            alt={settings.logo_alt}
            width={291}
            height={79}
            className="h-[56px] w-auto"
            priority
          />

        </Link>

        <nav
          className="hidden items-center gap-[18px] xl:flex"
          aria-label="Main navigation"
        >

          {navigation.map((item) => (

            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "border-b border-transparent px-2 py-2 font-sans text-[16px] font-normal uppercase tracking-[0.05em] text-white",
                "transition-[color,border-color] duration-[400ms] ease-in-out",
                "hover:border-[#F26329] hover:text-[#F26329] hover:underline"
              )}
            >
              {item.label}
            </Link>

          ))}

        </nav>

        <Link
          href={`mailto:${settings.contact_email}`}
          className={cn(
            "shrink-0 border border-[#F26329] px-6 py-2.5 font-sans text-[14px] font-normal uppercase tracking-[0.05em] text-white",
            "transition-[background-color,border-color] duration-[400ms] ease-in-out",
            "hover:bg-[#F26329] hover:text-white"
          )}
        >
          {settings.contact_button_label}
        </Link>

      </div>

    </header>
  );
}