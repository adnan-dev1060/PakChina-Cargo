import type { ErrorRequestHandler, RequestHandler } from "express";
import mongoose from "mongoose";
import { ZodError } from "zod";
import { isProd } from "../config/env.js";
import { HttpError } from "../utils/http.js";

export const notFound: RequestHandler = (req, _res, next) => {
  next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      message: err.issues[0]?.message ? `Validation failed: ${err.issues[0].path.join(".") || "input"} — ${err.issues[0].message}` : "Validation failed",
      errors: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
    return;
  }
  if (err instanceof HttpError) {
    res.status(err.status).json({ message: err.message, ...(err.details ? { details: err.details } : {}) });
    return;
  }
  if (err instanceof mongoose.Error.CastError) {
    res.status(404).json({ message: "Not found" });
    return;
  }
  if (err instanceof mongoose.Error.ValidationError) {
    res.status(400).json({ message: "Validation failed", errors: Object.values(err.errors).map((e) => ({ path: e.path, message: e.message })) });
    return;
  }
  if (err?.code === 11000) {
    const field = Object.keys(err.keyValue ?? {})[0] ?? "value";
    res.status(409).json({ message: `That ${field} is already in use` });
    return;
  }
  if (err?.type === "entity.parse.failed") {
    res.status(400).json({ message: "Malformed JSON body" });
    return;
  }
  if (err?.type === "entity.too.large") {
    res.status(413).json({ message: "Request body is too large" });
    return;
  }
  console.error(err);
  res.status(500).json({ message: "Internal server error", ...(isProd ? {} : { error: String(err?.message ?? err) }) });
};
