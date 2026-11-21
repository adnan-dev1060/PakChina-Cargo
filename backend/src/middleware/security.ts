import type { RequestHandler } from "express";
import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";
import { HttpError } from "../utils/http.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * CSRF defence for cookie-authenticated requests: browsers always send an Origin header
 * on cross-site writes, so any state-changing request from an unknown origin is rejected.
 */
export const checkOrigin: RequestHandler = (req, _res, next) => {
  if (SAFE_METHODS.has(req.method)) return next();
  const origin = req.get("origin");
  // Requests from the site this server itself serves are same-origin, not cross-site.
  const sameOrigin = origin === `${req.protocol}://${req.get("host")}`;
  if (origin && !sameOrigin && !env.CORS_ORIGINS.includes(origin)) throw new HttpError(403, "Origin not allowed");
  next();
};

const limiter = (windowMinutes: number, limit: number, message: string) =>
  rateLimit({
    windowMs: windowMinutes * 60_000,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    skip: () => env.NODE_ENV === "test",
    handler: (_req, res) => {
      res.status(429).json({ message });
    },
  });

export const loginLimiter = limiter(15, 10, "Too many login attempts. Please wait and try again.");
export const inquiryLimiter = limiter(60, 10, "Too many requests. Please contact us on WhatsApp instead.");
export const apiLimiter = limiter(1, 300, "Too many requests. Please slow down.");
