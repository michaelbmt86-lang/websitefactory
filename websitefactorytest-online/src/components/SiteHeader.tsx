"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  SearchIcon,
  UserIcon,
  ShoppingBagIcon,
  MenuIcon,
  XIcon,
} from "@/components/icons";

interface NavItem {
  label: string;
  href: string;
}

const defaultNavItems: NavItem[] = [
  { label: "Products", href: "/products" },
  { label: "Industries", href: "/industries" },
  { label: "About", href: "/about" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

export function SiteHeader({ navItems, logo }: { navItems?: NavItem[]; logo?: string }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const items = navItems && navItems.length > 0 ? navItems : defaultNavItems;

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
              src={logo || "/images/logo.png"}
              alt="Logo"
              width={120}
              height={40}
              className="h-[40px] w-auto"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-8 xl:flex" aria-label="Main navigation">
            {items.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-[14px] font-semibold uppercase tracking-[0.05em] text-[#252525] transition-colors duration-200 hover:text-[#007a55]"
              >
                {item.label}
              </Link>
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
            {items.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="block py-3 text-[15px] font-semibold uppercase tracking-[0.05em] text-[#252525] transition-colors hover:text-[#007a55]"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
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
