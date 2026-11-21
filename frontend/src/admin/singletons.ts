/** Form configuration for the single-document pages: site settings, homepage and About. */
import type { FormSection } from "./form/types";

export interface SingletonConfig {
  key: "settings" | "home" | "about";
  title: string;
  description: string;
  publicPath: string;
  sections: FormSection[];
}

export const SETTINGS: SingletonConfig = {
  key: "settings",
  title: "Site settings",
  description: "Company details, logo, contact numbers and search-engine text used across the whole website.",
  publicPath: "/contact",
  sections: [
    {
      title: "Company",
      fields: [
        { name: "companyName", label: "Company name", type: "text", required: true },
        { name: "tagline", label: "Tagline", type: "text", required: true },
        { name: "shortDescription", label: "Short description", type: "textarea", rows: 2, required: true, help: "Shown in the footer." },
        { name: "logoUrl", label: "Logo", type: "image", folder: "branding", required: true, help: "Shown in the header and footer. A square or wide logo on a white background works best." },
      ],
    },
    {
      title: "Contact",
      description: "Used by every “Call”, “WhatsApp” and email button on the site.",
      fields: [
        {
          name: "phones",
          label: "Phone numbers",
          type: "objectList",
          itemLabel: "Phone",
          titleField: "label",
          max: 6,
          help: "The first number is the main one shown in the header.",
          newItem: () => ({ label: "", number: "+92" }),
          fields: [
            { name: "label", label: "Label", type: "text", required: true, placeholder: "Main line" },
            { name: "number", label: "Number", type: "text", required: true, placeholder: "+92 300 1234567" },
          ],
        },
        { name: "whatsappNumber", label: "WhatsApp number", type: "text", required: true, placeholder: "923001234567", help: "International format with country code, e.g. 923001234567." },
        { name: "email", label: "Email", type: "text", placeholder: "info@…" },
        { name: "whatsappMessage", label: "Default WhatsApp message", type: "textarea", rows: 2, required: true, help: "Pre-filled when a visitor taps a WhatsApp button." },
        { name: "businessHours", label: "Business hours", type: "text", placeholder: "Mon–Sat, 10am–7pm", wide: true },
      ],
    },
    {
      title: "Social media",
      fields: [
        {
          name: "socials",
          label: "Profiles",
          type: "objectList",
          itemLabel: "Profile",
          titleField: "platform",
          max: 8,
          newItem: () => ({ platform: "facebook", url: "https://", handle: "" }),
          fields: [
            {
              name: "platform",
              label: "Platform",
              type: "select",
              required: true,
              options: ["facebook", "instagram", "linkedin", "youtube", "tiktok", "x"].map((p) => ({ value: p, label: p[0].toUpperCase() + p.slice(1) })),
            },
            { name: "handle", label: "Handle", type: "text", placeholder: "pakchinacargo" },
            { name: "url", label: "Profile link", type: "text", required: true, wide: true, placeholder: "https://facebook.com/…" },
          ],
        },
      ],
    },
    {
      title: "Search engines & sharing",
      description: "How the site appears on Google and when shared on WhatsApp or Facebook.",
      fields: [
        { name: "seo.title", label: "Site title", type: "text", required: true, maxLength: 120, wide: true },
        { name: "seo.description", label: "Site description", type: "textarea", rows: 2, required: true, maxLength: 300 },
        { name: "seo.ogImageUrl", label: "Sharing image", type: "image", folder: "branding", help: "Shown in link previews. 1200×630 px recommended." },
      ],
    },
  ],
};

const SECTION_LABELS: Record<string, string> = {
  intro: "Who we are",
  modes: "Shipping options",
  services: "Services",
  routes: "Routes map",
  commodities: "What we ship",
  process: "How it works",
  whyUs: "Why choose us",
  testimonials: "Testimonials",
  faq: "FAQ",
  updates: "Updates",
  cta: "Call to action",
};
export const sectionLabel = (key: string) => SECTION_LABELS[key] ?? key;

export const HOME: SingletonConfig = {
  key: "home",
  title: "Homepage",
  description: "The hero banner, introduction and the order and visibility of every homepage section.",
  publicPath: "/",
  sections: [
    {
      title: "Hero banner",
      fields: [
        { name: "hero.eyebrow", label: "Small label above the headline", type: "text", required: true, wide: true },
        { name: "hero.title", label: "Headline", type: "text", required: true },
        { name: "hero.highlight", label: "Highlighted part (gold)", type: "text", required: true },
        { name: "hero.subtitle", label: "Subtitle", type: "textarea", rows: 2, required: true },
        { name: "hero.imageUrl", label: "Background image", type: "image", folder: "banners", required: true, help: "Wide landscape photo, at least 1920 px wide." },
        { name: "hero.imageAlt", label: "Image description", type: "text", required: true, wide: true },
        { name: "hero.primaryCta.label", label: "Main button text", type: "text", required: true },
        { name: "hero.primaryCta.href", label: "Main button link", type: "text", required: true, help: "A page like /contact#quote, or “whatsapp”." },
        { name: "hero.secondaryCta.label", label: "Second button text", type: "text", required: true },
        { name: "hero.secondaryCta.href", label: "Second button link", type: "text", required: true, help: "Use “whatsapp” to open a WhatsApp chat." },
      ],
    },
    {
      title: "Introduction",
      fields: [
        { name: "intro.body", label: "Text", type: "paragraphs", itemLabel: "Paragraph", required: true },
        { name: "intro.points", label: "Key points", type: "list", itemLabel: "Point" },
        { name: "intro.imageUrl", label: "Image", type: "image", folder: "general", required: true },
        { name: "intro.imageAlt", label: "Image description", type: "text", required: true, wide: true },
      ],
    },
    {
      title: "Call-to-action band",
      fields: [
        { name: "cta.title", label: "Title", type: "text", required: true, wide: true },
        { name: "cta.body", label: "Text", type: "textarea", rows: 2, required: true },
      ],
    },
    {
      title: "Sections",
      description: "Switch sections on or off, change their order and edit their headings. Sections with no published content (e.g. Testimonials) stay hidden automatically.",
      fields: [
        {
          name: "sections",
          label: "Homepage sections (top to bottom)",
          type: "objectList",
          itemLabel: "Section",
          titleField: "key",
          fixed: true,
          sortable: true,
          orderField: "order",
          newItem: () => ({}),
          fields: [
            { name: "enabled", label: "Show on homepage", type: "toggle", wide: true },
            { name: "eyebrow", label: "Small label", type: "text" },
            { name: "title", label: "Heading", type: "text", required: true },
            { name: "subtitle", label: "Subheading", type: "textarea", rows: 2 },
          ],
        },
      ],
    },
  ],
};

export const ABOUT: SingletonConfig = {
  key: "about",
  title: "About page",
  description: "Company introduction, story, mission, vision and values.",
  publicPath: "/about",
  sections: [
    {
      title: "Introduction",
      fields: [
        { name: "title", label: "Page heading", type: "text", required: true, wide: true },
        { name: "intro", label: "Introduction", type: "textarea", rows: 4, required: true },
        { name: "story", label: "Our story", type: "paragraphs", itemLabel: "Paragraph" },
        { name: "imageUrl", label: "Image", type: "image", folder: "about", required: true },
        { name: "imageAlt", label: "Image description", type: "text", required: true, wide: true },
      ],
    },
    {
      title: "Mission & vision",
      fields: [
        { name: "mission", label: "Mission", type: "textarea", rows: 3, required: true },
        { name: "vision", label: "Vision", type: "textarea", rows: 3, required: true },
      ],
    },
    {
      title: "Values",
      fields: [
        {
          name: "values",
          label: "Values",
          type: "objectList",
          itemLabel: "Value",
          titleField: "title",
          max: 8,
          sortable: true,
          newItem: () => ({ title: "", description: "", icon: "shield-check" }),
          fields: [
            { name: "title", label: "Title", type: "text", required: true },
            { name: "description", label: "Description", type: "textarea", rows: 2, required: true },
            { name: "icon", label: "Icon", type: "icon", required: true, wide: true },
          ],
        },
      ],
    },
  ],
};
