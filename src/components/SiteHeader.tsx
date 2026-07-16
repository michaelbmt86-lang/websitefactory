"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  SearchIcon,
  UserIcon,
  ShoppingBagIcon,
  ChevronDownIcon,
  MenuIcon,
  XIcon,
} from "@/components/icons";

interface NavChildLink {
  label: string;
  href: string;
}

interface NavChildGroup {
  title: string;
  links: NavChildLink[];
}

interface NavItem {
  label: string;
  href: string;
  children?: NavChildGroup[];
}

const navItems: NavItem[] = [
  {
    label: "SHOP",
    href: "#",
    children: [
      {
        title: "New",
        links: [
          { label: "New Cups", href: "/new-products/new-cups" },
          { label: "New Containers and Lids", href: "/new-products/new-containers-and-lids" },
          { label: "New Cup Lids & Accessories", href: "/new-products/new-cup-lids-accessories" },
        ],
      },
      {
        title: "Cups",
        links: [
          { label: "Single Wall Hot Cups", href: "/cups/single-wall" },
          { label: "Double Wall Hot Cups", href: "/cups/double-wall" },
          { label: "Cup Lids & Accessories", href: "/cups/lids-accessories" },
          { label: "Cold Cups & Lids", href: "/cups/cold-cups" },
          { label: "Reusable Coffee Cups & Lids", href: "/cups/reusable-cups" },
        ],
      },
      {
        title: "Containers",
        links: [
          { label: "Containers & Lids", href: "/containers-lids/containers" },
          { label: "Bowls", href: "/containers-lids/bowls" },
          { label: "Clamshells", href: "/containers-lids/clamshells" },
          { label: "Chip Cups", href: "/containers-lids/chip-cups" },
          { label: "Sauce Cups", href: "/containers-lids/sauce-cups" },
          { label: "Ice Cream Cups", href: "/containers-lids/ice-cream-cups-and-lids" },
        ],
      },
      {
        title: "More",
        links: [
          { label: "Plates & Trays", href: "/plates-trays" },
          { label: "Cutlery & Straws", href: "/cutlery-straws" },
          { label: "Bags", href: "/bags" },
          { label: "Napkins & Gloves", href: "/napkins-washroom" },
          { label: "Retail", href: "/retail" },
          { label: "Sale", href: "/au-sale" },
        ],
      },
    ],
  },
  { label: "CUSTOM", href: "/custom-packaging" },
  { label: "INDUSTRY", href: "/industry" },
  { label: "SUSTAINABILITY", href: "/environmental-responsibility" },
  { label: "NEWS", href: "/resources" },
  { label: "ABOUT US", href: "/about" },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileShopOpen, setMobileShopOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const closeMega = useCallback(() => setMegaOpen(false), []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white shadow-[0_2px_10px_rgba(0,0,0,0.1)]"
            : "bg-white/95 backdrop-blur-[8px] shadow-none"
        } border-b border-black/5`}
      >
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-6">
          {/* Logo */}
          <Link href="/" className="shrink-0">
            <Image
              src="/images/logo.png"
              alt="BioPak"
              width={120}
              height={40}
              className="h-[40px] w-auto"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-8 xl:flex" aria-label="Main navigation">
            {navItems.map((item) => (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => item.children && setMegaOpen(true)}
                onMouseLeave={closeMega}
              >
                <Link
                  href={item.href}
                  className={`flex items-center gap-1 text-[14px] font-semibold uppercase tracking-[0.05em] transition-colors duration-200 ${
                    megaOpen && item.children
                      ? "text-[#007a55]"
                      : "text-[#252525] hover:text-[#007a55]"
                  }`}
                  onClick={(e) => {
                    if (item.children) {
                      e.preventDefault();
                      setMegaOpen((prev) => !prev);
                    }
                  }}
                >
                  {item.label}
                  {item.children && (
                    <ChevronDownIcon
                      size={14}
                      className={`transition-transform duration-200 ${megaOpen ? "rotate-180" : ""}`}
                    />
                  )}
                </Link>

                {/* Mega Menu */}
                {item.children && megaOpen && (
                  <div
                    className="absolute left-1/2 top-full -translate-x-1/2 pt-2"
                    onMouseEnter={() => setMegaOpen(true)}
                    onMouseLeave={closeMega}
                  >
                    <div className="grid min-w-[640px] grid-cols-4 gap-8 rounded-xl border border-black/5 bg-white p-8 shadow-lg">
                      {item.children.map((group) => (
                        <div key={group.title}>
                          <h3 className="mb-3 text-[13px] font-bold uppercase tracking-wider text-[#007a55]">
                            {group.title}
                          </h3>
                          <ul className="space-y-2">
                            {group.links.map((link) => (
                              <li key={link.href}>
                                <Link
                                  href={link.href}
                                  className="text-[13px] text-[#252525] transition-colors hover:text-[#007a55]"
                                  onClick={closeMega}
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
                )}
              </div>
            ))}
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="hidden h-10 w-10 items-center justify-center rounded-lg text-[#252525] transition-colors hover:bg-black/5 hover:text-[#007a55] xl:flex"
              aria-label="Search"
            >
              <SearchIcon size={20} />
            </button>
            <button
              type="button"
              className="hidden h-10 w-10 items-center justify-center rounded-lg text-[#252525] transition-colors hover:bg-black/5 hover:text-[#007a55] xl:flex"
              aria-label="Account"
            >
              <UserIcon size={20} />
            </button>
            <button
              type="button"
              className="relative hidden h-10 w-10 items-center justify-center rounded-lg text-[#252525] transition-colors hover:bg-black/5 hover:text-[#007a55] xl:flex"
              aria-label="Cart"
            >
              <ShoppingBagIcon size={20} />
            </button>

            {/* Mobile Menu Button */}
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-[#252525] transition-colors hover:bg-black/5 xl:hidden"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              onClick={() => setMobileOpen((prev) => !prev)}
            >
              {mobileOpen ? <XIcon size={22} /> : <MenuIcon size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 top-[72px] z-40 bg-white transition-transform duration-300 xl:hidden ${
          mobileOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <nav className="h-full overflow-y-auto px-6 pb-24 pt-6">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.label}>
                {item.children ? (
                  <>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between py-3 text-[15px] font-semibold uppercase tracking-[0.05em] text-[#252525]"
                      onClick={() => setMobileShopOpen((prev) => !prev)}
                    >
                      {item.label}
                      <ChevronDownIcon
                        size={18}
                        className={`transition-transform duration-200 ${mobileShopOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    {mobileShopOpen && (
                      <div className="space-y-5 pb-4 pl-4">
                        {item.children.map((group) => (
                          <div key={group.title}>
                            <h3 className="mb-2 text-[12px] font-bold uppercase tracking-wider text-[#007a55]">
                              {group.title}
                            </h3>
                            <ul className="space-y-1.5">
                              {group.links.map((link) => (
                                <li key={link.href}>
                                  <Link
                                    href={link.href}
                                    className="block py-1 text-[14px] text-[#252525] transition-colors hover:text-[#007a55]"
                                    onClick={() => setMobileOpen(false)}
                                  >
                                    {link.label}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href}
                    className="block py-3 text-[15px] font-semibold uppercase tracking-[0.05em] text-[#252525] transition-colors hover:text-[#007a55]"
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>

          {/* Mobile Action Buttons */}
          <div className="mt-6 flex items-center gap-4 border-t border-black/5 pt-6">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-[#252525] transition-colors hover:bg-black/5 hover:text-[#007a55]"
              aria-label="Search"
            >
              <SearchIcon size={20} />
            </button>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-[#252525] transition-colors hover:bg-black/5 hover:text-[#007a55]"
              aria-label="Account"
            >
              <UserIcon size={20} />
            </button>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-[#252525] transition-colors hover:bg-black/5 hover:text-[#007a55]"
              aria-label="Cart"
            >
              <ShoppingBagIcon size={20} />
            </button>
          </div>
        </nav>
      </div>

      {/* Spacer so content isn't hidden behind fixed header */}
      <div className="h-[72px]" />
    </>
  );
}
