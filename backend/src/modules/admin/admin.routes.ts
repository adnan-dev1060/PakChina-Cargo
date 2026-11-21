import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { Faq, Service, CargoRoute, Testimonial } from "../../models/content.models.js";
import { Inquiry, Media } from "../../models/system.models.js";
import { ok } from "../../utils/http.js";
import { adminContentRouter } from "../content/content.routes.js";
import { adminInquiryRouter } from "../inquiries/inquiry.routes.js";
import { mediaRouter } from "../media/media.routes.js";
import { userRouter } from "../users/user.routes.js";

/** Everything under /api/v1/admin requires a signed-in admin. */
export const adminRouter = Router();

adminRouter.use(requireAuth);

adminRouter.get("/stats", async (_req, res) => {
  const [newInquiries, totalInquiries, services, routes, faqs, testimonials, media, recentInquiries, pendingTestimonials] = await Promise.all([
    Inquiry.countDocuments({ status: "new" }),
    Inquiry.countDocuments(),
    Service.countDocuments(),
    CargoRoute.countDocuments(),
    Faq.countDocuments(),
    Testimonial.countDocuments(),
    Media.countDocuments(),
    Inquiry.find().sort({ createdAt: -1 }).limit(5),
    Testimonial.countDocuments({ status: "pending" }),
  ]);
  res.json(ok({ newInquiries, totalInquiries, services, routes, faqs, testimonials, media, recentInquiries, pendingTestimonials }));
});

adminRouter.use("/content", adminContentRouter);
adminRouter.use("/media", mediaRouter);
adminRouter.use("/inquiries", adminInquiryRouter);
adminRouter.use("/users", requireRole("super_admin"), userRouter);
