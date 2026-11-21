import { Router } from "express";
import mongoose, { type HydratedDocument, type Model, type SortOrder } from "mongoose";
import { z } from "zod";
import { HttpError, ok } from "../../utils/http.js";
import { reorderSchema } from "./content.schemas.js";

interface CollectionConfig {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: Model<any>;
  schema: z.ZodObject;
  /** Human label used in error messages, e.g. "Service". */
  label: string;
  /** Field used for public lookup by slug (e.g. /services/:slug). */
  slugField?: string;
  sort?: Record<string, SortOrder>;
  /** Extra conditions for what the public site may see, on top of `published: true`. */
  publicFilter?: Record<string, unknown>;
  /** Fields that are never sent to the public site. */
  privateFields?: string[];
  /** Fields the admin form doesn't edit; an admin save keeps their current values. */
  keepFields?: string[];
  /** Runs before every admin create, save and publish; throws to refuse it. */
  guard?: (next: { published?: boolean }, existing?: HydratedDocument<unknown>) => void;
}

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");
const publishToggle = z.object({ published: z.boolean() });

/**
 * Builds the public (read-only, published items) and admin (full CRUD) routers for one collection.
 * Admin writes are full replacements validated by the collection's Zod schema.
 */
export function createCollection({
  model,
  schema,
  label,
  slugField,
  sort = { order: 1, createdAt: 1 },
  publicFilter = {},
  privateFields = [],
  keepFields = [],
  guard,
}: CollectionConfig) {
  const publicQuery = { published: true, ...publicFilter };
  const publicSelect = privateFields.map((f) => `-${f}`).join(" ");
  const publicRouter = Router();
  const adminRouter = Router();

  const findOr404 = async (id: string) => {
    const doc = await model.findById(objectId.parse(id));
    if (!doc) throw new HttpError(404, `${label} not found`);
    return doc;
  };

  /* ------------------------------ Public ------------------------------ */
  publicRouter.get("/", async (_req, res) => {
    res.json(ok(await model.find(publicQuery).select(publicSelect).sort(sort)));
  });

  if (slugField) {
    publicRouter.get("/:slug", async (req, res) => {
      const doc = await model.findOne({ [slugField]: String(req.params.slug).toLowerCase(), ...publicQuery }).select(publicSelect);
      if (!doc) throw new HttpError(404, `${label} not found`);
      res.json(ok(doc));
    });
  }

  /* ------------------------------- Admin ------------------------------- */
  adminRouter.get("/", async (_req, res) => {
    res.json(ok(await model.find().sort(sort)));
  });

  // Must be declared before "/:id" routes.
  adminRouter.put("/reorder", async (req, res) => {
    const { ids } = reorderSchema.parse(req.body);
    const count = await model.countDocuments({ _id: { $in: ids } });
    if (count !== ids.length) throw new HttpError(400, "Some items in the new order no longer exist");
    await model.bulkWrite(ids.map((id, index) => ({ updateOne: { filter: { _id: id }, update: { $set: { order: index } } } })));
    res.json(ok(await model.find().sort(sort)));
  });

  adminRouter.get("/:id", async (req, res) => {
    res.json(ok(await findOr404(req.params.id)));
  });

  adminRouter.post("/", async (req, res) => {
    const data = schema.parse(req.body);
    guard?.(data);
    if (req.body?.order === undefined) {
      // New items go to the end of the list.
      const last = await model.findOne().sort({ order: -1 }).select("order").lean<{ order?: number }>();
      data.order = (last?.order ?? -1) + 1;
    }
    res.status(201).json(ok(await model.create(data)));
  });

  adminRouter.put("/:id", async (req, res) => {
    const doc = await findOr404(req.params.id);
    const data = schema.parse(req.body);
    guard?.(data, doc);
    const kept = Object.fromEntries(keepFields.map((f) => [f, doc.get(f)]));
    doc.overwrite({ ...data, ...kept, createdAt: doc.get("createdAt") });
    await doc.save();
    res.json(ok(doc));
  });

  adminRouter.patch("/:id/publish", async (req, res) => {
    const { published } = publishToggle.parse(req.body);
    const doc = await findOr404(req.params.id);
    guard?.({ published }, doc);
    doc.set("published", published);
    await doc.save();
    res.json(ok(doc));
  });

  adminRouter.delete("/:id", async (req, res) => {
    const doc = await findOr404(req.params.id);
    await doc.deleteOne();
    res.json(ok({ id: req.params.id, deleted: true }));
  });

  return { publicRouter, adminRouter, model, schema };
}

export const isValidObjectId = (id: string) => mongoose.isValidObjectId(id) && /^[a-f\d]{24}$/i.test(id);
