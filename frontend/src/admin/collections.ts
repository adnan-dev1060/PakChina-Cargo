/**
 * Admin configuration for each content collection: list display and form fields.
 * Field names and shapes mirror backend/src/modules/content/content.schemas.ts.
 */
import type { FieldDef, FormSection } from "./form/types";

type Item = Record<string, unknown>;

export interface CollectionConfig {
  key: string;
  label: string;
  singular: string;
  description: string;
  /** Where it appears on the public site (for "View on site"). */
  publicPath?: (item: Item) => string;
  title: (item: Item) => string;
  subtitle?: (item: Item) => string;
  image?: (item: Item) => string | undefined;
  icon?: (item: Item) => string | undefined;
  sections: FormSection[];
  empty: () => Item;
  /** Sorted by date on the site, so manual ordering is hidden. */
  orderable?: boolean;
  /** Items can arrive from the website and wait for an admin to approve or reject them. */
  reviewable?: boolean;
}

const MODES = [
  { value: "sea", label: "Sea" },
  { value: "air", label: "Air" },
  { value: "road", label: "Road" },
];

const publishFields: FieldDef[] = [{ name: "published", label: "Published", type: "toggle", help: "Show this on the website" }];

export const COLLECTIONS: Record<string, CollectionConfig> = {
  services: {
    key: "services",
    label: "Services",
    singular: "Service",
    description: "Service cards on the homepage, the Services page and each service's own page.",
    publicPath: (i) => `/services/${i.slug}`,
    title: (i) => String(i.title ?? ""),
    subtitle: (i) => String(i.summary ?? ""),
    image: (i) => i.imageUrl as string,
    icon: (i) => i.icon as string,
    empty: () => ({ title: "", slug: "", summary: "", description: [""], icon: "box", imageUrl: "", features: [], published: true }),
    sections: [
      {
        title: "Basics",
        fields: [
          { name: "title", label: "Title", type: "text", required: true, maxLength: 100 },
          { name: "slug", label: "Page address", type: "slug", from: "title", required: true },
          { name: "summary", label: "Short summary", type: "textarea", rows: 2, required: true, maxLength: 300, help: "Shown on cards and at the top of the service page." },
          { name: "icon", label: "Icon", type: "icon", required: true, wide: true },
          { name: "imageUrl", label: "Image", type: "image", folder: "services", required: true },
        ],
      },
      {
        title: "Page content",
        fields: [
          { name: "description", label: "Description", type: "paragraphs", itemLabel: "Paragraph", required: true },
          { name: "features", label: "What's included", type: "list", itemLabel: "Feature", placeholder: "e.g. Customs clearance in Pakistan" },
        ],
      },
      { title: "Visibility", fields: publishFields },
    ],
  },

  "shipping-modes": {
    key: "shipping-modes",
    label: "Shipping modes",
    singular: "Shipping mode",
    description: "Sea / air options with transit times, shown in the hero strip and the “Choose your speed” section.",
    title: (i) => `${i.title} · ${i.transitTime}`,
    subtitle: (i) => String(i.summary ?? ""),
    image: (i) => i.imageUrl as string,
    empty: () => ({ mode: "sea", title: "", transitTime: "", summary: "", bestFor: [], imageUrl: "", published: true }),
    sections: [
      {
        title: "Details",
        fields: [
          { name: "mode", label: "Mode", type: "select", options: MODES, required: true },
          { name: "title", label: "Title", type: "text", required: true, placeholder: "Sea Freight" },
          { name: "transitTime", label: "Transit time", type: "text", required: true, placeholder: "45–60 days" },
          { name: "summary", label: "Summary", type: "textarea", rows: 2, required: true },
          { name: "bestFor", label: "Best for", type: "list", itemLabel: "Point" },
          { name: "imageUrl", label: "Image", type: "image", folder: "banners", required: true },
        ],
      },
      { title: "Visibility", fields: publishFields },
    ],
  },

  routes: {
    key: "routes",
    label: "Routes",
    singular: "Route",
    description: "Routes and destinations shown on the Routes page and the route map.",
    publicPath: () => "/routes",
    title: (i) => `${i.origin} → ${i.destination}`,
    subtitle: (i) => ((i.legs as { mode: string; transitTime: string }[]) ?? []).map((l) => `${l.mode}: ${l.transitTime}`).join(" · "),
    empty: () => ({ origin: "China", originCountry: "China", destination: "", destinationCountry: "Pakistan", legs: [{ mode: "sea", transitTime: "" }], description: "", published: true }),
    sections: [
      {
        title: "Route",
        fields: [
          { name: "origin", label: "Origin", type: "text", required: true },
          { name: "originCountry", label: "Origin country", type: "text", required: true },
          { name: "destination", label: "Destination city", type: "text", required: true, help: "Known cities are placed on the route map automatically." },
          { name: "destinationCountry", label: "Destination country", type: "text", required: true },
          { name: "description", label: "Description", type: "textarea", rows: 2, required: true },
          {
            name: "legs",
            label: "Shipping options",
            type: "objectList",
            itemLabel: "Option",
            max: 3,
            newItem: () => ({ mode: "air", transitTime: "" }),
            fields: [
              { name: "mode", label: "Mode", type: "select", options: MODES, required: true },
              { name: "transitTime", label: "Transit time", type: "text", required: true, placeholder: "10–12 days" },
            ],
          },
        ],
      },
      { title: "Visibility", fields: publishFields },
    ],
  },

  offices: {
    key: "offices",
    label: "Offices",
    singular: "Office",
    description: "Office locations on the Contact and About pages, header and footer.",
    publicPath: () => "/contact",
    title: (i) => String(i.city ?? ""),
    subtitle: (i) => String(i.address || i.label || ""),
    empty: () => ({ city: "", label: "", address: "", phone: "", mapQuery: "", published: true }),
    sections: [
      {
        title: "Office",
        fields: [
          { name: "city", label: "City", type: "text", required: true },
          { name: "label", label: "Name", type: "text", required: true, placeholder: "Lahore Office" },
          { name: "address", label: "Street address", type: "textarea", rows: 2 },
          { name: "phone", label: "Office phone", type: "text" },
          { name: "mapQuery", label: "Google Maps search", type: "text", required: true, wide: true, help: "What to search on Google Maps, e.g. “Pak China Cargo, Hall Road, Lahore”." },
        ],
      },
      { title: "Visibility", fields: publishFields },
    ],
  },

  commodities: {
    key: "commodities",
    label: "What we ship",
    singular: "Item",
    description: "Goods categories shown in the “What we ship” section.",
    title: (i) => String(i.title ?? ""),
    subtitle: (i) => String(i.titleUrdu ?? ""),
    icon: (i) => i.icon as string,
    empty: () => ({ title: "", titleUrdu: "", icon: "box", note: "", published: true }),
    sections: [
      {
        title: "Item",
        fields: [
          { name: "title", label: "Title (English)", type: "text", required: true },
          { name: "titleUrdu", label: "Title (Urdu)", type: "text", dir: "rtl" },
          { name: "note", label: "Note", type: "text", wide: true, help: "Optional small print, e.g. carrier restrictions." },
          { name: "icon", label: "Icon", type: "icon", required: true, wide: true },
        ],
      },
      { title: "Visibility", fields: publishFields },
    ],
  },

  "process-steps": {
    key: "process-steps",
    label: "How it works",
    singular: "Step",
    description: "Numbered steps in the “How it works” section.",
    title: (i) => String(i.title ?? ""),
    subtitle: (i) => String(i.description ?? ""),
    icon: (i) => i.icon as string,
    empty: () => ({ title: "", description: "", icon: "box", published: true }),
    sections: [
      {
        title: "Step",
        fields: [
          { name: "title", label: "Title", type: "text", required: true },
          { name: "description", label: "Description", type: "textarea", rows: 2, required: true },
          { name: "icon", label: "Icon", type: "icon", required: true, wide: true },
        ],
      },
      { title: "Visibility", fields: publishFields },
    ],
  },

  highlights: {
    key: "highlights",
    label: "Why choose us",
    singular: "Reason",
    description: "Reasons shown in the “Why Pak China Cargo” section.",
    title: (i) => String(i.title ?? ""),
    subtitle: (i) => String(i.description ?? ""),
    icon: (i) => i.icon as string,
    empty: () => ({ title: "", description: "", icon: "box", published: true }),
    sections: [
      {
        title: "Reason",
        fields: [
          { name: "title", label: "Title", type: "text", required: true },
          { name: "description", label: "Description", type: "textarea", rows: 2, required: true },
          { name: "icon", label: "Icon", type: "icon", required: true, wide: true },
        ],
      },
      { title: "Visibility", fields: publishFields },
    ],
  },

  testimonials: {
    key: "testimonials",
    label: "Testimonials",
    singular: "Testimonial",
    description: "Client reviews. Reviews sent from the website wait here until you approve them; reviews you add yourself go live straight away.",
    reviewable: true,
    title: (i) => String(i.name ?? ""),
    subtitle: (i) => String(i.quote ?? ""),
    image: (i) => i.avatarUrl as string | undefined,
    empty: () => ({ name: "", company: "", city: "", quote: "", rating: 5, avatarUrl: "", published: true }),
    sections: [
      {
        title: "Testimonial",
        fields: [
          { name: "name", label: "Client name", type: "text", required: true },
          { name: "company", label: "Company", type: "text" },
          { name: "city", label: "City", type: "text" },
          { name: "rating", label: "Rating (1–5)", type: "number", min: 1, max: 5 },
          { name: "quote", label: "Quote", type: "textarea", rows: 4, required: true },
          { name: "avatarUrl", label: "Photo", type: "image", folder: "testimonials" },
        ],
      },
      { title: "Visibility", fields: publishFields },
    ],
  },

  faqs: {
    key: "faqs",
    label: "FAQs",
    singular: "FAQ",
    description: "Questions on the homepage and Contact page.",
    title: (i) => String(i.question ?? ""),
    subtitle: (i) => String(i.answer ?? ""),
    empty: () => ({ question: "", answer: "", category: "", published: true }),
    sections: [
      {
        title: "Question",
        fields: [
          { name: "question", label: "Question", type: "text", required: true, wide: true },
          { name: "answer", label: "Answer", type: "textarea", rows: 4, required: true },
          { name: "category", label: "Category", type: "text", help: "Optional grouping label." },
        ],
      },
      { title: "Visibility", fields: publishFields },
    ],
  },

  updates: {
    key: "updates",
    label: "Updates",
    singular: "Update",
    description: "Company news and posts. The section appears on the homepage once one is published (newest first).",
    orderable: false,
    title: (i) => String(i.title ?? ""),
    subtitle: (i) => (i.publishedAt ? new Date(String(i.publishedAt)).toLocaleDateString() : ""),
    image: (i) => i.imageUrl as string | undefined,
    empty: () => ({ title: "", slug: "", excerpt: "", imageUrl: "", publishedAt: new Date().toISOString().slice(0, 10), externalUrl: "", published: true }),
    sections: [
      {
        title: "Update",
        fields: [
          { name: "title", label: "Title", type: "text", required: true },
          { name: "slug", label: "Short name", type: "slug", from: "title", required: true },
          { name: "publishedAt", label: "Date", type: "date", required: true },
          { name: "externalUrl", label: "Link (optional)", type: "text", placeholder: "https://facebook.com/…", help: "e.g. the original Facebook post." },
          { name: "excerpt", label: "Text", type: "textarea", rows: 3, required: true },
          { name: "imageUrl", label: "Image", type: "image", folder: "updates" },
        ],
      },
      { title: "Visibility", fields: publishFields },
    ],
  },
};
