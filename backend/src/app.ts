import "./config/db.js";
import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env, isProd } from "./config/env.js";
import { errorHandler, notFound } from "./middleware/error.js";
import { apiLimiter, checkOrigin } from "./middleware/security.js";
import { adminRouter } from "./modules/admin/admin.routes.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { publicContentRouter } from "./modules/content/content.routes.js";
import { healthRouter } from "./modules/health/health.routes.js";
import { publicInquiryRouter } from "./modules/inquiries/inquiry.routes.js";
import { publicTestimonialRouter } from "./modules/testimonials/testimonial.routes.js";
import { createSiteRouter } from "./modules/site/site.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      // Applies to the website pages this server sends: only our own scripts run; images may come
      // from Cloudinary (uploads) and Unsplash (placeholder photos); the Contact page embeds Google Maps.
      contentSecurityPolicy: {
        directives: {
          "default-src": ["'self'"],
          "script-src": ["'self'"],
          "style-src": ["'self'", "'unsafe-inline'"],
          "img-src": ["'self'", "data:", "blob:", "https://res.cloudinary.com", "https://images.unsplash.com"],
          "font-src": ["'self'", "data:"],
          "connect-src": ["'self'"],
          "frame-src": ["https://www.google.com", "https://maps.google.com"],
          "object-src": ["'none'"],
          "base-uri": ["'self'"],
          "form-action": ["'self'"],
          "frame-ancestors": ["'self'"],
          "upgrade-insecure-requests": isProd ? [] : null,
        },
      },
    }),
  );
  app.use(
    cors({
      origin: (origin, cb) => cb(null, !origin || env.CORS_ORIGINS.includes(origin)),
      credentials: true,
    }),
  );
  app.use(compression()); // gzip API responses (JSON shrinks to roughly a quarter)
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  const api = express.Router();
  api.use(apiLimiter);
  api.use(checkOrigin);

  api.use("/health", healthRouter);
  api.use("/auth", authRouter);
  api.use("/inquiries", publicInquiryRouter);
  api.use("/testimonials", publicTestimonialRouter); // POST only; GET is the public content list
  api.use("/admin", (_req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  }, adminRouter);
  api.use("/", publicContentRouter);

  app.use("/api/v1", api);

  // The website itself (when frontend/dist has been built): pages, files, sitemap and robots.txt.
  const site = createSiteRouter();
  if (site) app.use(site);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
