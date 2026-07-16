import Link from "next/link";
import {
  FacebookIcon,
  LinkedinIcon,
  PhoneIcon,
  MailIcon,
  MapPinIcon,
} from "@/components/icons";

const footerLinks = [
  {
    title: "Shop",
    links: [
      { label: "All Products", href: "/containers-lids" },
      { label: "Drinks", href: "/cups" },
      { label: "Food Packaging", href: "/containers-lids" },
      { label: "Service & Accessories", href: "/napkins-washroom" },
      { label: "Bags & Carry", href: "/bags" },
      { label: "Kits", href: "/cutlery-straws" },
    ],
  },
  {
    title: "Custom",
    links: [
      { label: "BioPak Catalogue", href: "/biopak-catalogue" },
      { label: "BioPak Price List", href: "/biopak-price-list" },
      { label: "Custom Packaging", href: "/custom-packaging" },
      { label: "Design Process", href: "/design-process" },
      { label: "Request Quote", href: "/request-quote" },
      { label: "My Account", href: "/customer/account" },
    ],
  },
  {
    title: "Solutions",
    links: [
      { label: "Plastic Ban", href: "/single-use-plastic-bans" },
      { label: "Disposal Guide", href: "/disposal" },
      { label: "Compost Connect", href: "/compost-connect" },
      {
        label: "Customer Stories",
        href: "/resources/category/customer-stories",
      },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Why Choose BioPak", href: "/about/why-choose-biopak" },
      { label: "Sustainability", href: "/environmental-responsibility" },
      { label: "Give Back Fund", href: "/about/give-back-fund" },
      {
        label: "Sustainable Sourcing",
        href: "/resources/ethical-sourcing-policy",
      },
      { label: "Media Centre", href: "/media-centre" },
      { label: "News & Resources", href: "/resources" },
      { label: "Awards", href: "/awards" },
      { label: "Contact Us", href: "/contact" },
    ],
  },
];

const supportLinks = [
  { label: "Delivery & Returns Policy", href: "/support/delivery-returns" },
  { label: "Terms & Conditions", href: "/terms-and-conditions" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Track Your order", href: "/support/track" },
  { label: "Payment Methods", href: "/support/payment" },
  { label: "Become a Distributor", href: "/support/become-a-distributor" },
  { label: "Preference Centre", href: "/preference-centre" },
  { label: "FAQs", href: "/faq" },
];

const contactInfo = {
  phone: "1300 246 725",
  email: "sales@biopak.com.au",
  location: "Sydney, Australia",
};

const socialLinks = [
  {
    platform: "Facebook",
    url: "https://www.facebook.com/biopak/",
    icon: FacebookIcon,
  },
  {
    platform: "LinkedIn",
    url: "https://www.linkedin.com/company/biopakpackaging/",
    icon: LinkedinIcon,
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-[rgb(21,21,21)] px-4 pt-16 pb-8 text-white">
      <div className="mx-auto grid max-w-[1280px] gap-16 md:grid-cols-[1fr_2fr]">
        <div className="max-w-[320px]">
          <Link href="/" className="mb-4 block">
            <span className="text-xl font-bold tracking-tight text-white">
              BioPak
            </span>
          </Link>

          <p className="mb-6 text-sm leading-[22px] text-white/70">
            Award-winning plant-based compostable packaging that puts the planet
            first. Designed for the circular economy.
          </p>

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
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {footerLinks.map((column) => (
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
            <a
              href={`tel:${contactInfo.phone}`}
              className="flex items-center gap-2 text-sm text-white/70 transition-colors hover:text-white"
            >
              <PhoneIcon size={16} />
              {contactInfo.phone}
            </a>
            <a
              href={`mailto:${contactInfo.email}`}
              className="flex items-center gap-2 text-sm text-white/70 transition-colors hover:text-white"
            >
              <MailIcon size={16} />
              {contactInfo.email}
            </a>
            <span className="flex items-center gap-2 text-sm text-white/70">
              <MapPinIcon size={16} />
              {contactInfo.location}
            </span>
          </div>

          <p className="text-sm text-white/50">
            &copy; {new Date().getFullYear()} BioPak. All rights reserved.
          </p>

          <div className="flex gap-4">
            {supportLinks.map((link) => (
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
