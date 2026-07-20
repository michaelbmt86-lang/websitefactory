import { SiteHeader } from "@/components/SiteHeader";
import { HeroSection } from "@/components/HeroSection";
import { ValueProps } from "@/components/ValueProps";
import { CategoryGrid } from "@/components/CategoryGrid";
import { CustomProgram } from "@/components/CustomProgram";
import { SiteFooter } from "@/components/SiteFooter";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <HeroSection />
        <ValueProps />
        <CategoryGrid />
        <CustomProgram />
      </main>
      <SiteFooter />
    </>
  );
}
