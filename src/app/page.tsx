import { SiteHeader } from "@/components/SiteHeader";
import { HeroSection } from "@/components/HeroSection";
import { TechnologySection } from "@/components/TechnologySection";
import { CtaBanner } from "@/components/CtaBanner";
import { ExecutiveTeamSection } from "@/components/ExecutiveTeamSection";
import { SiteFooter } from "@/components/SiteFooter";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <HeroSection />
        <TechnologySection />
        <CtaBanner />
        <ExecutiveTeamSection />
      </main>
      <SiteFooter />
    </>
  );
}
