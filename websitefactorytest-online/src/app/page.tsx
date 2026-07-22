import { SiteHeader } from "@/components/SiteHeader";
import { HeroSection } from "@/components/HeroSection";
import { ValueProps } from "@/components/ValueProps";
import { CategoryGrid } from "@/components/CategoryGrid";
import { CustomProgram } from "@/components/CustomProgram";
import { SiteFooter } from "@/components/SiteFooter";
import { getNavigation, getCategories, getSettings } from "@/lib/site";

export const dynamic = "force-dynamic";

export default function Home() {
  const settings = getSettings();
  const navItems = getNavigation().map((item) => ({
    label: item.label,
    href: item.href,
  }));

  const categories = getCategories().map((cat) => ({
    name: cat.name,
    slug: cat.slug,
    description: cat.description,
    image_url: cat.image_url,
  }));

  return (
    <>
      <SiteHeader navItems={navItems} logo={settings.logo} />
      <main>
        <HeroSection />
        <ValueProps />
        <CategoryGrid categories={categories} />
        <CustomProgram />
      </main>
      <SiteFooter />
    </>
  );
}
