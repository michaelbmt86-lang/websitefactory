export interface NavItem {
  label: string;
  href: string;
}

export interface BenefitItem {
  icon: string;
  title: string;
}

export interface TeamMember {
  name: string;
  title: string;
  bio: string;
  image: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Technology", href: "#technology" },
  { label: "Team", href: "#team" },
  { label: "Benefits", href: "#benefits" },
  { label: "Products", href: "#products" },
  { label: "Use Cases", href: "#use-cases" },
  { label: "Blog", href: "#blog" },
];

export const BENEFITS: BenefitItem[] = [
  {
    icon: "/images/www.solidhydrogen.tech/icon-cost.png",
    title:
      "Low cost – Cheapest storage of H2 per kg per cycle against any gaseous, liquid or solid storage",
  },
  {
    icon: "/images/www.solidhydrogen.tech/icon-nontoxic.png",
    title: "Pure H2 with no toxic or explosion risk",
  },
  {
    icon: "/images/www.solidhydrogen.tech/icon-longlife.png",
    title: "Long Life – 30 years+",
  },
  {
    icon: "/images/www.solidhydrogen.tech/icon-recyclable.png",
    title: "Fully recyclable",
  },
  {
    icon: "/images/www.solidhydrogen.tech/icon-large-energy.png",
    title: "Large energy density",
  },
  {
    icon: "/images/www.solidhydrogen.tech/icon-temperature.png",
    title: "Long term storage and efficient at all temperatures",
  },
  {
    icon: "/images/www.solidhydrogen.tech/icon-metals.png",
    title: "Independent from rare and expensive raw materials",
  },
  {
    icon: "/images/www.solidhydrogen.tech/icon-independent.png",
    title: "Provides independence for energy",
  },
  {
    icon: "/images/www.solidhydrogen.tech/icon-volume.png",
    title: "Low volume- 3 times as much energy per litre as H2 at 700 bar",
  },
  {
    icon: "/images/www.solidhydrogen.tech/icon-quick-cycles.png",
    title: "Quick cycles",
  },
  {
    icon: "/images/www.solidhydrogen.tech/icon-hydrogen-tank.png",
    title: "Unparalleled flexibility in Hydrogen use",
  },
];

export const TEAM_MEMBERS: TeamMember[] = [
  {
    name: "Prof. Francois Aguey-Zinsou",
    title: "CTO",
    bio: "With three world firsts in over 20 years of hydrogen R&D, Prof Aguey is a world-renowned expert in hydrides development and uses in industry A professor of chemistry at the University of Sydney, Prof Aguey is an advisor to the G7 on the hydrogen development path.",
    image: "/images/www.solidhydrogen.tech/pic-francois.png",
  },
  {
    name: "Philippe Odouard",
    title: "CEO",
    bio: "After years at the helm of large defence companies, Mr Odouard was the CEO of two successful listed start-ups in technology involving hardware design, industrialisation and worldwide commercialisation. He managed P/L up to $500m of sales and 700 people.",
    image: "/images/www.solidhydrogen.tech/pic-philippe.png",
  },
];
