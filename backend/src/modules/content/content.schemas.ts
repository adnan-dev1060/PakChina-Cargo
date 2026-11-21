/**
 * Zod schemas for every piece of admin-managed content.
 * These validate all writes from the admin dashboard; the shapes match frontend/src/types/content.ts.
 */
import { z } from "zod";

/** "" and null (how unset values come back from the database / forms) both mean "not set". */
const unset = z.union([z.literal(""), z.null()]).transform(() => undefined);

const text = (max = 200) => z.string().trim().min(1, "Required").max(max);
const optionalText = (max = 200) => z.string().trim().max(max).optional().or(unset);
const textList = (maxItems = 20, max = 200) => z.array(text(max)).max(maxItems).default([]);

/** Absolute https URL or a site-relative path like /brand/logo.jpg */
export const imageUrl = z
  .string()
  .trim()
  .max(1000)
  .refine((v) => v.startsWith("/") || /^https:\/\/\S+$/.test(v), "Must be an https URL or a /path");
const optionalImageUrl = imageUrl.optional().or(unset);

const iconKey = z.string().trim().regex(/^[a-z0-9-]{1,40}$/, "Invalid icon key");
const slug = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens");
export const shippingModeKey = z.enum(["sea", "air", "road"]);

const publishable = {
  order: z.coerce.number().int().min(0).max(10_000).default(0),
  published: z.boolean().default(true),
};

/* ------------------------------ Collections ------------------------------ */

export const officeSchema = z.object({
  ...publishable,
  city: text(60),
  label: text(80),
  address: optionalText(300),
  phone: optionalText(30),
  mapQuery: text(200),
});

export const shippingModeSchema = z.object({
  ...publishable,
  mode: shippingModeKey,
  title: text(80),
  transitTime: text(40),
  summary: text(400),
  bestFor: textList(8, 120),
  imageUrl,
});

export const serviceSchema = z.object({
  ...publishable,
  slug,
  title: text(100),
  summary: text(300),
  description: z.array(text(3000)).min(1).max(20),
  icon: iconKey,
  imageUrl,
  features: textList(20, 160),
});

export const cargoRouteSchema = z.object({
  ...publishable,
  origin: text(80),
  originCountry: text(60),
  destination: text(80),
  destinationCountry: text(60),
  legs: z.array(z.object({ mode: shippingModeKey, transitTime: text(40) })).min(1).max(3),
  description: text(600),
});

export const commoditySchema = z.object({
  ...publishable,
  title: text(80),
  titleUrdu: optionalText(80),
  icon: iconKey,
  note: optionalText(200),
});

export const processStepSchema = z.object({
  ...publishable,
  title: text(80),
  description: text(400),
  icon: iconKey,
});

export const highlightSchema = processStepSchema;

export const testimonialSchema = z.object({
  ...publishable,
  name: text(80),
  company: optionalText(100),
  city: optionalText(60),
  quote: text(1000),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  avatarUrl: optionalImageUrl,
});

export const faqSchema = z.object({
  ...publishable,
  question: text(250),
  answer: text(3000),
  category: optionalText(60),
});

export const updatePostSchema = z.object({
  ...publishable,
  slug,
  title: text(160),
  excerpt: text(600),
  imageUrl: optionalImageUrl,
  publishedAt: z.coerce.date(),
  externalUrl: z.url({ protocol: /^https?$/ }).max(1000).optional().or(unset),
});

/* ------------------------------- Singletons ------------------------------- */

export const siteSettingsSchema = z.object({
  companyName: text(100),
  tagline: text(160),
  shortDescription: text(400),
  logoUrl: imageUrl,
  phones: z
    .array(
      z.object({
        label: text(40),
        number: z.string().trim().regex(/^\+?[\d\s-]{7,20}$/, "Invalid phone number"),
      }),
    )
    .max(6),
  whatsappNumber: z
    .string()
    .trim()
    .transform((v) => v.replace(/\D/g, ""))
    .pipe(z.string().regex(/^\d{8,15}$/, "Use international format, e.g. 923001234567")),
  whatsappMessage: text(300),
  email: z.email().max(160).optional().or(unset),
  businessHours: optionalText(160),
  socials: z
    .array(
      z.object({
        platform: z.enum(["facebook", "instagram", "linkedin", "youtube", "tiktok", "x"]),
        url: z.url({ protocol: /^https$/ }).max(500),
        handle: optionalText(60),
      }),
    )
    .max(8),
  seo: z.object({
    title: text(120),
    description: text(300),
    ogImageUrl: optionalImageUrl,
  }),
});

const cta = z.object({ label: text(40), href: text(300) });

export const homeSectionKey = z.enum([
  "intro",
  "modes",
  "services",
  "routes",
  "commodities",
  "process",
  "whyUs",
  "testimonials",
  "faq",
  "updates",
  "cta",
]);

export const homeContentSchema = z.object({
  hero: z.object({
    eyebrow: text(80),
    title: text(120),
    highlight: text(120),
    subtitle: text(400),
    imageUrl,
    imageAlt: text(160),
    primaryCta: cta,
    secondaryCta: cta,
  }),
  intro: z.object({
    body: z.array(text(1500)).min(1).max(6),
    imageUrl,
    imageAlt: text(160),
    points: textList(8, 80),
  }),
  cta: z.object({ title: text(120), body: text(400) }),
  sections: z
    .array(
      z.object({
        key: homeSectionKey,
        enabled: z.boolean(),
        order: z.coerce.number().int().min(0).max(100),
        eyebrow: optionalText(60),
        title: text(120),
        subtitle: optionalText(300),
      }),
    )
    .max(homeSectionKey.options.length)
    .refine((list) => new Set(list.map((s) => s.key)).size === list.length, "Each section can appear only once"),
});

export const aboutContentSchema = z.object({
  title: text(160),
  intro: text(1500),
  story: z.array(text(3000)).max(10),
  mission: text(600),
  vision: text(600),
  imageUrl,
  imageAlt: text(160),
  values: z.array(z.object({ title: text(60), description: text(300), icon: iconKey })).max(8),
});

/* ------------------------------- Utilities ------------------------------- */

export const reorderSchema = z.object({
  ids: z.array(z.string().regex(/^[a-f\d]{24}$/i, "Invalid id")).min(1).max(500),
});
