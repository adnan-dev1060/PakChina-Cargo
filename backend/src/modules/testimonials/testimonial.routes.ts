import { Router } from "express";
import { z } from "zod";
import { inquiryLimiter } from "../../middleware/security.js";
import { Testimonial } from "../../models/content.models.js";
import { HttpError, ok } from "../../utils/http.js";

const optional = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal("").transform(() => undefined));

/** What a client can send from the website's "Share your experience" form. */
const submissionInput = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  company: optional(100),
  city: optional(60),
  quote: z.string().trim().min(20, "Please write at least a sentence or two (20+ characters)").max(1000),
  rating: z.coerce.number().int().min(1).max(5),
  /** Phone or email, so the team can confirm the review is real. Never shown on the site. */
  contact: optional(160),
  /** Honeypot: hidden from people, bots fill it in. */
  website: z.string().max(0).optional(),
});

/* ------------------------------ Public ------------------------------ */
export const publicTestimonialRouter = Router();

publicTestimonialRouter.post("/", inquiryLimiter, async (req, res) => {
  const parsed = submissionInput.safeParse(req.body);
  if (!parsed.success) {
    // A filled honeypot means a bot: pretend success so it doesn't retry.
    if (typeof req.body?.website === "string" && req.body.website.length > 0) {
      res.status(201).json(ok({ received: true }));
      return;
    }
    throw parsed.error;
  }
  const { website: _hp, ...data } = parsed.data;
  const last = await Testimonial.findOne().sort({ order: -1 }).select("order").lean<{ order?: number }>();
  // The shared collection() helper does not carry field types, hence the cast.
  await new Testimonial({
    ...data,
    status: "pending",
    source: "website",
    published: false,
    order: (last?.order ?? -1) + 1,
  } as Record<string, unknown>).save();
  res.status(201).json(ok({ received: true }));
});

/* ------------------------------- Admin ------------------------------- */
const reviewInput = z.object({ decision: z.enum(["approve", "reject"]) });

/** PATCH /admin/content/testimonials/:id/review: approving publishes it, rejecting hides it. */
export const testimonialReviewRouter = Router();

testimonialReviewRouter.patch("/:id/review", async (req, res) => {
  const { decision } = reviewInput.parse(req.body);
  if (!/^[a-f\d]{24}$/i.test(req.params.id)) throw new HttpError(404, "Testimonial not found");
  const doc = await Testimonial.findById(req.params.id);
  if (!doc) throw new HttpError(404, "Testimonial not found");
  doc.set({ status: decision === "approve" ? "approved" : "rejected", published: decision === "approve" });
  await doc.save();
  res.json(ok(doc));
});
