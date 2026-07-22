import Link from "next/link";
import { getSettings, getNavigation } from "@/lib/site";
import {
  FacebookIcon,
  LinkedinIcon,
  PhoneIcon,
  MailIcon,
  MapPinIcon,
} from "@/components/icons";

export function SiteFooter() {
  const settings = getSettings();
  const navItems = getNavigation();

  const siteName = settings.site_name || process.env.SITE_NAME || "";
  const phone = settings.phone || "";
  const email = settings.email || "";
  const address = settings.address || "";

  const socialLinks = [
    settings.facebook_url ? { platform: "Facebook", url: settings.facebook_url, icon: FacebookIcon } : null,
    settings.linkedin_url ? { platform: "LinkedIn", url: settings.linkedin_url, icon: LinkedinIcon } : null,
  ].filter(Boolean) as { platform: string; url: string; icon: typeof FacebookIcon }[];

  // Build footer link columns from navigation + standard pages
  const footerColumns = [
    {
      title: "Pages",
      links: navItems.map((item) => ({ label: item.label, href: item.href })),
    },
    {
      title: "Support",
      links: [
        { label: "Contact Us", href: "/contact" },
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms & Conditions", href: "/terms" },
      ],
    },
  ];

  return (
    <footer className="bg-[rgb(21,21,21)] px-4 pt-16 pb-8 text-white">
      <div className="mx-auto grid max-w-[1280px] gap-16 md:grid-cols-[1fr_2fr]">
        <div className="max-w-[320px]">
          <Link href="/" className="mb-4 block">
            <span className="text-xl font-bold tracking-tight text-white">
              {siteName || "Website"}
            </span>
          </Link>

          {settings.meta_description && (
            <p className="mb-6 text-sm leading-[22px] text-white/70">
              {settings.meta_description}
            </p>
          )}

          {socialLinks.length > 0 && (
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.platform}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.platform}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-[rgb(0,122,85)]"
                >
                  <social.icon size={18} />
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {footerColumns.map((column) => (
            <div key={column.title}>
              <h3 className="mb-4 text-sm font-bold text-white">
                {column.title}
              </h3>
              <ul>
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="block py-1.5 text-sm text-white/70 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-12 max-w-[1280px] border-t border-white/10 pt-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex flex-wrap justify-center gap-8">
            {phone && (
              <a
                href={`tel:${phone.replace(/\s/g, "")}`}
                className="flex items-center gap-2 text-sm text-white/70 transition-colors hover:text-white"
              >
                <PhoneIcon size={16} />
                {phone}
              </a>
            )}
            {email && (
              <a
                href={`mailto:${email}`}
                className="flex items-center gap-2 text-sm text-white/70 transition-colors hover:text-white"
              >
                <MailIcon size={16} />
                {email}
              </a>
            )}
            {address && (
              <span className="flex items-center gap-2 text-sm text-white/70">
                <MapPinIcon size={16} />
                {address}
              </span>
            )}
          </div>

          <p className="text-sm text-white/50">
            &copy; {new Date().getFullYear()} {siteName || "Website"}. All rights reserved.
          </p>

          <div className="flex gap-4">
            {footerColumns[1]?.links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-white/20"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
