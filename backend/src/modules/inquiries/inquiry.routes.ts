import { Router } from "express";
import { z } from "zod";
import { inquiryLimiter } from "../../middleware/security.js";
import { INQUIRY_STATUSES, Inquiry } from "../../models/system.models.js";
import { HttpError, ok } from "../../utils/http.js";

const inquiryInput = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().regex(/^\+?[\d\s-]{10,16}$/, "Enter a valid phone number"),
  email: z.email().max(160).optional().or(z.literal("").transform(() => undefined)),
  city: z.string().trim().min(2).max(60),
  mode: z.enum(["sea", "air", "road", "not-sure"]).default("not-sure"),
  cargoType: z.string().trim().min(2).max(120),
  message: z.string().trim().max(1500).default(""),
  /** Honeypot: hidden from people, bots fill it in. */
  website: z.string().max(0).optional(),
});

const listQuery = z.object({
  status: z.enum(INQUIRY_STATUSES).optional(),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

const updateInput = z.object({
  status: z.enum(INQUIRY_STATUSES).optional(),
  notes: z.string().trim().max(3000).optional(),
});

const escapeRegex = (v: string) => v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/* ------------------------------ Public ------------------------------ */
export const publicInquiryRouter = Router();

publicInquiryRouter.post("/", inquiryLimiter, async (req, res) => {
  const parsed = inquiryInput.safeParse(req.body);
  if (!parsed.success) {
    // A filled honeypot means a bot: pretend success so it doesn't retry.
    if (typeof req.body?.website === "string" && req.body.website.length > 0) {
      res.status(201).json(ok({ received: true }));
      return;
    }
    throw parsed.error;
  }
  const { website: _hp, ...data } = parsed.data;
  const inquiry = await Inquiry.create(data);
  res.status(201).json(ok({ id: String(inquiry._id), received: true }));
});

/* ------------------------------- Admin ------------------------------- */
export const adminInquiryRouter = Router();

adminInquiryRouter.get("/", async (req, res) => {
  const { status, q, page, limit } = listQuery.parse(req.query);
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (q) {
    const rx = new RegExp(escapeRegex(q), "i");
    filter.$or = [{ name: rx }, { phone: rx }, { email: rx }, { city: rx }, { cargoType: rx }];
  }
  const [items, total] = await Promise.all([
    Inquiry.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Inquiry.countDocuments(filter),
  ]);
  res.json(ok({ items, total, page, pages: Math.ceil(total / limit) }));
});

adminInquiryRouter.get("/:id", async (req, res) => {
  const inquiry = await Inquiry.findById(req.params.id);
  if (!inquiry) throw new HttpError(404, "Inquiry not found");
  res.json(ok(inquiry));
});

adminInquiryRouter.patch("/:id", async (req, res) => {
  const update = updateInput.parse(req.body);
  const inquiry = await Inquiry.findByIdAndUpdate(req.params.id, update, { returnDocument: "after", runValidators: true });
  if (!inquiry) throw new HttpError(404, "Inquiry not found");
  res.json(ok(inquiry));
});

adminInquiryRouter.delete("/:id", async (req, res) => {
  const inquiry = await Inquiry.findByIdAndDelete(req.params.id);
  if (!inquiry) throw new HttpError(404, "Inquiry not found");
  res.json(ok({ id: req.params.id, deleted: true }));
});
