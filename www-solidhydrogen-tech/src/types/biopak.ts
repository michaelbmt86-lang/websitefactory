export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  salePrice?: number;
  sku: string;
  imageUrl: string;
  galleryImages: string[];
  categoryId: number;
  inStock: boolean;
  isNew: boolean;
  isFeatured: boolean;
  attributes: ProductAttribute[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductAttribute {
  name: string;
  value: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  parentId: number | null;
  displayOrder: number;
  isActive: boolean;
  children?: Category[];
}

export interface Navigation {
  id: number;
  label: string;
  href: string;
  isExternal: boolean;
  parentId: number | null;
  displayOrder: number;
  children?: Navigation[];
  megaMenu?: MegaMenu;
}

export interface MegaMenu {
  columns: MegaMenuColumn[];
  featuredImage?: string;
  featuredText?: string;
}

export interface MegaMenuColumn {
  title: string;
  links: MegaMenuLink[];
}

export interface MegaMenuLink {
  label: string;
  href: string;
  description?: string;
  icon?: string;
}

export interface HeroSlide {
  id: number;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaHref: string;
  imageUrl: string;
  mobileImageUrl?: string;
  overlayColor?: string;
  overlayOpacity?: number;
}

export interface ValueProp {
  id: number;
  title: string;
  description: string;
  iconUrl: string;
  href?: string;
}

export interface TrustBadge {
  id: number;
  label: string;
  icon?: string;
}

export interface FooterSection {
  id: number;
  title: string;
  links: FooterLink[];
}

export interface FooterLink {
  label: string;
  href: string;
  isExternal?: boolean;
}

export interface ContactInfo {
  phone: string;
  email: string;
  address: string;
  socialLinks: SocialLink[];
}

export interface SocialLink {
  platform: string;
  url: string;
  icon: string;
}

export interface SiteSettings {
  siteName: string;
  logo: string;
  favicon: string;
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
}

export interface Page {
  id: number;
  title: string;
  slug: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}
