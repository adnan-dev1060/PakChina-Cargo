import { Router } from "express";
import type { z } from "zod";
import {
  CargoRoute,
  Commodity,
  Faq,
  Highlight,
  Office,
  ProcessStep,
  Service,
  ShippingMode,
  Singleton,
  Testimonial,
  UpdatePost,
  type SingletonKey,
} from "../../models/content.models.js";
import { HttpError, ok } from "../../utils/http.js";
import { testimonialReviewRouter } from "../testimonials/testimonial.routes.js";
import { createCollection } from "./collection.factory.js";
import {
  aboutContentSchema,
  cargoRouteSchema,
  commoditySchema,
  faqSchema,
  highlightSchema,
  homeContentSchema,
  officeSchema,
  processStepSchema,
  serviceSchema,
  shippingModeSchema,
  siteSettingsSchema,
  testimonialSchema,
  updatePostSchema,
} from "./content.schemas.js";

/** URL segment → collection. The same segment is used under /api/v1 (public) and /api/v1/admin. */
export const COLLECTIONS = {
  offices: createCollection({ model: Office, schema: officeSchema, label: "Office" }),
  "shipping-modes": createCollection({ model: ShippingMode, schema: shippingModeSchema, label: "Shipping mode" }),
  services: createCollection({ model: Service, schema: serviceSchema, label: "Service", slugField: "slug" }),
  routes: createCollection({ model: CargoRoute, schema: cargoRouteSchema, label: "Route" }),
  commodities: createCollection({ model: Commodity, schema: commoditySchema, label: "Commodity" }),
  "process-steps": createCollection({ model: ProcessStep, schema: processStepSchema, label: "Process step" }),
  highlights: createCollection({ model: Highlight, schema: highlightSchema, label: "Highlight" }),
  testimonials: createCollection({
    model: Testimonial,
    schema: testimonialSchema,
    label: "Testimonial",
    // Reviews sent from the website stay off the site until an admin approves them.
    publicFilter: { status: { $nin: ["pending", "rejected"] } },
    privateFields: ["contact", "status", "source"],
    keepFields: ["status", "source", "contact"],
    guard: (next, existing) => {
      const status = existing?.get("status") ?? "approved";
      if (next.published && status !== "approved") {
        throw new HttpError(409, "Approve this testimonial before publishing it.");
      }
    },
  }),
  faqs: createCollection({ model: Faq, schema: faqSchema, label: "FAQ" }),
  updates: createCollection({
    model: UpdatePost,
    schema: updatePostSchema,
    label: "Update",
    slugField: "slug",
    sort: { publishedAt: -1 },
  }),
};

export const SINGLETONS: Record<SingletonKey, z.ZodType> = {
  settings: siteSettingsSchema,
  home: homeContentSchema,
  about: aboutContentSchema,
};

export async function getSingleton(key: SingletonKey) {
  const doc = await Singleton.findOne({ key }).lean<{ data: unknown }>();
  if (!doc) throw new HttpError(404, `The ${key} content hasn't been set up yet`);
  return doc.data;
}

export async function saveSingleton(key: SingletonKey, input: unknown) {
  // JSON round-trip drops undefined keys so they are not stored as null.
  const data = JSON.parse(JSON.stringify(SINGLETONS[key].parse(input)));
  await Singleton.findOneAndUpdate({ key }, { data }, { upsert: true, runValidators: true });
  return data;
}

/* ------------------------------ Public routes ------------------------------ */
/**
 * Browsers must check back every time (cheap: unchanged content returns 304 via the ETag),
 * so an admin save shows on the website immediately instead of after a cache delay.
 */
const PUBLIC_CACHE = "public, no-cache";

export const publicContentRouter = Router();

for (const key of Object.keys(SINGLETONS) as SingletonKey[]) {
  publicContentRouter.get(`/${key}`, async (_req, res) => {
    res.set("Cache-Control", PUBLIC_CACHE);
    res.json(ok(await getSingleton(key)));
  });
}
for (const [segment, c] of Object.entries(COLLECTIONS)) {
  publicContentRouter.use(`/${segment}`, (_req, res, next) => {
    res.set("Cache-Control", PUBLIC_CACHE);
    next();
  }, c.publicRouter);
}

/* ------------------------------ Admin routes ------------------------------ */
export const adminContentRouter = Router();

for (const key of Object.keys(SINGLETONS) as SingletonKey[]) {
  adminContentRouter.get(`/${key}`, async (_req, res) => {
    const doc = await Singleton.findOne({ key }).lean<{ data: unknown }>();
    res.json(ok(doc?.data ?? null));
  });
  adminContentRouter.put(`/${key}`, async (req, res) => {
    res.json(ok(await saveSingleton(key, req.body)));
  });
}
adminContentRouter.use("/testimonials", testimonialReviewRouter);
for (const [segment, c] of Object.entries(COLLECTIONS)) {
  adminContentRouter.use(`/${segment}`, c.adminRouter);
}
