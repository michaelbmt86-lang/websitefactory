export const WEBSITE_COMPONENTS = [
    {
      name: "Header",
      file: "src/components/SiteHeader.tsx",
      table: "navigation",
      api: "/api/navigation",
    },
  
    {
      name: "Hero",
      file: "src/components/HeroSection.tsx",
      table: "hero",
      api: "/api/hero",
    },
  
    {
      name: "Technology",
      file: "src/components/TechnologySection.tsx",
      table: "benefits",
      api: "/api/benefits",
    },
  
    {
      name: "Team",
      file: "src/components/ExecutiveTeamSection.tsx",
      table: "team_members",
      api: "/api/team",
    },
  
    {
      name: "Footer",
      file: "src/components/SiteFooter.tsx",
      table: "footer",
      api: "/api/footer",
    },
  ] as const;