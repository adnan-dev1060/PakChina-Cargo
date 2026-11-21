/**
 * Content types shared by the public site and (later) the admin dashboard.
 * The backend API will return these same shapes.
 */

export type ID = string;

export type ShippingModeKey = "sea" | "air" | "road";

export interface Publishable {
  id: ID;
  order: number;
  published: boolean;
}

export interface Cta {
  label: string;
  href: string;
}

export interface PhoneNumber {
  label: string;
  /** International format, e.g. +923038896424 */
  number: string;
}

export interface SocialLink {
  platform: "facebook" | "instagram" | "linkedin" | "youtube" | "tiktok" | "x";
  url: string;
  handle?: string;
}

export interface SiteSettings {
  companyName: string;
  tagline: string;
  shortDescription: string;
  logoUrl: string;
  phones: PhoneNumber[];
  /** WhatsApp number in international format without "+" or spaces, e.g. 923038896424 */
  whatsappNumber: string;
  whatsappMessage: string;
  email?: string;
  businessHours?: string;
  socials: SocialLink[];
  seo: { title: string; description: string; ogImageUrl?: string };
}

export interface Office extends Publishable {
  city: string;
  label: string;
  address?: string;
  phone?: string;
  /** Text used for the Google Maps embed, e.g. "Pak China Cargo, Lahore". */
  mapQuery: string;
}

export interface HeroContent {
  eyebrow: string;
  title: string;
  highlight: string;
  subtitle: string;
  imageUrl: string;
  imageAlt: string;
  primaryCta: Cta;
  secondaryCta: Cta;
}

export interface ShippingMode extends Publishable {
  mode: ShippingModeKey;
  title: string;
  transitTime: string;
  summary: string;
  bestFor: string[];
  imageUrl: string;
}

export interface Service extends Publishable {
  slug: string;
  title: string;
  summary: string;
  description: string[];
  icon: string;
  imageUrl: string;
  features: string[];
}

export interface RouteLeg {
  mode: ShippingModeKey;
  transitTime: string;
}

export interface CargoRoute extends Publishable {
  origin: string;
  originCountry: string;
  destination: string;
  destinationCountry: string;
  legs: RouteLeg[];
  description: string;
}

export interface Commodity extends Publishable {
  title: string;
  titleUrdu?: string;
  icon: string;
  note?: string;
}

export interface ProcessStep extends Publishable {
  title: string;
  description: string;
  icon: string;
}

export interface Highlight extends Publishable {
  title: string;
  description: string;
  icon: string;
}

/** A review sent from the website's form. */
export interface TestimonialInput {
  name: string;
  company?: string;
  city?: string;
  quote: string;
  rating: number;
  contact?: string;
  website?: string;
}

export interface Testimonial extends Publishable {
  name: string;
  company?: string;
  city?: string;
  quote: string;
  rating?: number;
  avatarUrl?: string;
}

export interface Faq extends Publishable {
  question: string;
  answer: string;
  category?: string;
}

export interface UpdatePost extends Publishable {
  slug: string;
  title: string;
  excerpt: string;
  imageUrl?: string;
  publishedAt: string;
  externalUrl?: string;
}

export interface AboutContent {
  title: string;
  intro: string;
  story: string[];
  mission: string;
  vision: string;
  imageUrl: string;
  imageAlt: string;
  values: { title: string; description: string; icon: string }[];
}

export type HomeSectionKey =
  | "intro"
  | "modes"
  | "services"
  | "routes"
  | "commodities"
  | "process"
  | "whyUs"
  | "testimonials"
  | "faq"
  | "updates"
  | "cta";

export interface HomeSection {
  key: HomeSectionKey;
  enabled: boolean;
  order: number;
  eyebrow?: string;
  title: string;
  subtitle?: string;
}

export interface HomeContent {
  hero: HeroContent;
  intro: { body: string[]; imageUrl: string; imageAlt: string; points: string[] };
  cta: { title: string; body: string };
  sections: HomeSection[];
}

export type InquiryMode = ShippingModeKey | "not-sure";

export interface InquiryInput {
  name: string;
  phone: string;
  email?: string;
  city: string;
  mode: InquiryMode;
  cargoType: string;
  message: string;
  /** Spam trap: hidden from people, so it is only ever filled in by bots. */
  website?: string;
}
