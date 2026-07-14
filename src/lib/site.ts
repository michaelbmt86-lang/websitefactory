import db from "./db";

/* ===========================
   Hero
=========================== */

export interface HeroData {
  id: number;
  title1: string;
  title2: string;
  title3: string;
  video: string;
  poster: string;
}

export function getHero(): HeroData {
  const row = db.prepare(`
    SELECT *
    FROM hero
    LIMIT 1
  `).get() as HeroData | undefined;

  return (
    row ?? {
      id: 1,
      title1: "",
      title2: "",
      title3: "",
      video: "",
      poster: "",
    }
  );
}

/* ===========================
   Navigation
=========================== */

export interface NavigationItem {
  id: number;
  label: string;
  href: string;
  sort_order: number;
}

export function getNavigation(): NavigationItem[] {
  return db.prepare(`
    SELECT *
    FROM navigation
    ORDER BY sort_order
  `).all() as NavigationItem[];
}

/* ===========================
   Benefits
=========================== */

export interface BenefitItem {
  id: number;
  icon: string;
  title: string;
}

export function getBenefits(): BenefitItem[] {
  return db.prepare(`
    SELECT *
    FROM benefits
    ORDER BY id
  `).all() as BenefitItem[];
}

/* ===========================
   Team
=========================== */

export interface TeamMember {
  id: number;
  name: string;
  position: string;
  bio: string;
  image: string;
}

export function getTeamMembers(): TeamMember[] {
  return db.prepare(`
    SELECT *
    FROM team_members
    ORDER BY id
  `).all() as TeamMember[];
}

/* ===========================
   Footer
=========================== */

export interface FooterData {
  id: number;
  address: string;
  copyright: string;
  email: string;
  description: string;
  contact_button_label: string;
}

export function getFooter(): FooterData {
  const row = db.prepare(`
    SELECT *
    FROM footer
    LIMIT 1
  `).get() as FooterData | undefined;

  return (
    row ?? {
      id: 1,
      address: "",
      copyright: "",
      email: "",
      description: "",
      contact_button_label: "Contact Us",
    }
  );
}

/* ===========================
   Hero Animated (SOLID/SAFE)
=========================== */

export interface HeroAnimated {
  id: number;
  word1: string;
  word2: string;
}

export function getHeroAnimated(): HeroAnimated {
  const row = db.prepare("SELECT * FROM hero_animated LIMIT 1").get() as HeroAnimated | undefined;
  return row ?? { id: 1, word1: "SOLID", word2: "SAFE" };
}

/* ===========================
   Technology Section
=========================== */

export interface TechnologySection {
  id: number;
  heading: string;
  paragraph1_label: string;
  paragraph1_body: string;
  paragraph2_label: string;
  paragraph2_body: string;
  benefits_heading: string;
  benefits_subheading: string;
  cta_prefix: string;
  cta_suffix: string;
  cta_email: string;
  cta_label: string;
}

export function getTechnologySection(): TechnologySection {
  const row = db.prepare("SELECT * FROM technology_section LIMIT 1").get() as TechnologySection | undefined;
  return row ?? {
    id: 1,
    heading: "HYDRIDES - A PROVEN TECHNOLOGY FOR HYDROGEN STORAGE",
    paragraph1_label: "SOLIDHYDROGEN",
    paragraph1_body: "specialises in a certain class of hydrides functioning at ambient temperatures, for real life applications.",
    paragraph2_label: "SOLIDHYDROGEN",
    paragraph2_body: "has developed revolutionary systems and production processes to manufacture hydrides at reduced costs - 10x compared to current market prices - making hydrogen storage, compression and filtration affordable.",
    benefits_heading: "SOLIDHYDROGEN hydrides solutions have the following benefits",
    benefits_subheading: "OUR ADVANTAGE",
    cta_prefix: "Contact us",
    cta_suffix: "to find out more about SOLIDHYDROGEN",
    cta_email: "contact@solidhydrogen.tech",
    cta_label: "Contact us",
  };
}

/* ===========================
   Team Section Text
=========================== */

export interface TeamSectionText {
  id: number;
  heading_1: string;
  heading_2: string;
  heading_3: string;
  subheading_1: string;
  subheading_2: string;
  subheading_3: string;
}

export function getTeamSectionText(): TeamSectionText {
  const row = db.prepare("SELECT * FROM team_section_text LIMIT 1").get() as TeamSectionText | undefined;
  return row ?? {
    id: 1,
    heading_1: "Our", heading_2: "Executive", heading_3: "Team",
    subheading_1: "BEST OF CLASS", subheading_2: "TECHNICALLY", subheading_3: "AND IN BUSINESS",
  };
}

/* ===========================
   Footer Details (location, address)
=========================== */

export interface FooterDetails {
  id: number;
  location_name: string;
  address_line1: string;
  address_line2: string;
}

export function getFooterDetails(): FooterDetails {
  const row = db.prepare("SELECT * FROM footer_details LIMIT 1").get() as FooterDetails | undefined;
  return row ?? {
    id: 1,
    location_name: "SYDNEY KNOWLEDGE HUB",
    address_line1: "Level 2, Merewether Building H04,",
    address_line2: "The University of Sydney, NSW 2006",
  };
}

/* ===========================
   Header Settings
=========================== */

export interface HeaderSettings {
  id: number;
  contact_button_label: string;
  contact_email: string;
  logo: string;
  logo_alt: string;
}

export function getHeaderSettings(): HeaderSettings {
  const row = db.prepare("SELECT * FROM header_settings LIMIT 1").get() as HeaderSettings | undefined;
  return row ?? {
    id: 1,
    contact_button_label: "Contact Us",
    contact_email: "contact@solidhydrogen.tech",
    logo: "/images/www.solidhydrogen.tech/sh-logo-v2.png",
    logo_alt: "Solid Hydrogen",
  };
}