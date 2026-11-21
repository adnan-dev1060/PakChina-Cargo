import { Router } from "express";
import { fileTypeFromBuffer } from "file-type";
import multer from "multer";
import { z } from "zod";
import { deleteImage, uploadImage } from "../../config/cloudinary.js";
import { env } from "../../config/env.js";
import { Service, ShippingMode, Singleton, Testimonial, UpdatePost } from "../../models/content.models.js";
import { Media } from "../../models/system.models.js";
import { HttpError, ok } from "../../utils/http.js";

export const MEDIA_FOLDERS = ["general", "branding", "banners", "services", "about", "testimonials", "updates"] as const;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024, files: 1 },
});

/** Wraps multer so its errors become clean 400 responses. */
const singleFile = (field: string) =>
  ((req, res, next) =>
    upload.single(field)(req, res, (err: unknown) => {
      if (!err) return next();
      if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
        return next(new HttpError(400, `Image is too large. Maximum size is ${env.MAX_UPLOAD_MB} MB.`));
      }
      next(new HttpError(400, err instanceof Error ? err.message : "Upload failed"));
    })) as import("express").RequestHandler;

const uploadMeta = z.object({
  folder: z.enum(MEDIA_FOLDERS).default("general"),
  alt: z.string().trim().max(200).default(""),
});
const listQuery = z.object({
  folder: z.enum(MEDIA_FOLDERS).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(40),
});

const SINGLETON_NAMES: Record<string, string> = { settings: "Site settings", home: "Homepage", about: "About page" };

/**
 * Finds content that still references an image URL, so it isn't deleted while in use.
 * `usages` are machine keys; `places` are readable names for the admin ("Service: Sea Freight").
 */
async function findUsages(url: string) {
  const usages: string[] = [];
  const places: string[] = [];
  const singletons = await Singleton.find().lean<{ key: string; data: unknown }[]>();
  for (const s of singletons) {
    if (JSON.stringify(s.data).includes(url)) {
      usages.push(s.key);
      places.push(SINGLETON_NAMES[s.key] ?? s.key);
    }
  }
  // Collections: image fields are imageUrl / avatarUrl.
  const checks = [
    { key: "services", label: "Service", model: Service, field: "imageUrl", name: "title" },
    { key: "shipping-modes", label: "Shipping mode", model: ShippingMode, field: "imageUrl", name: "title" },
    { key: "testimonials", label: "Testimonial", model: Testimonial, field: "avatarUrl", name: "name" },
    { key: "updates", label: "Update", model: UpdatePost, field: "imageUrl", name: "title" },
  ] as const;
  for (const { key, label, model, field, name } of checks) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const docs: Record<string, unknown>[] = await (model as any).find({ [field]: url }).select(name).lean();
    if (!docs.length) continue;
    usages.push(key);
    for (const d of docs) places.push(`${label}: ${String(d[name] ?? "")}`);
  }
  return { usages, places };
}

export const mediaRouter = Router();

mediaRouter.get("/", async (req, res) => {
  const { folder, page, limit } = listQuery.parse(req.query);
  const filter = folder ? { folder } : {};
  const [items, total] = await Promise.all([
    Media.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Media.countDocuments(filter),
  ]);
  res.json(ok({ items, total, page, pages: Math.ceil(total / limit) }));
});

mediaRouter.post("/", singleFile("file"), async (req, res) => {
  if (!req.file) throw new HttpError(400, "Choose an image to upload");
  const { folder, alt } = uploadMeta.parse(req.body ?? {});

  // Trust the file's actual bytes, not its name or the browser-supplied type.
  const detected = await fileTypeFromBuffer(req.file.buffer);
  if (!detected || !ALLOWED_MIME.has(detected.mime)) {
    throw new HttpError(400, "Only JPG, PNG, WebP or AVIF images are allowed");
  }

  const result = await uploadImage(req.file.buffer, folder);
  const media = await Media.create({
    url: result.secure_url,
    publicId: result.public_id,
    folder,
    alt,
    width: result.width,
    height: result.height,
    format: result.format,
    bytes: result.bytes,
    uploadedBy: req.user?.id,
  });
  res.status(201).json(ok(media));
});

mediaRouter.patch("/:id", async (req, res) => {
  const { alt } = z.object({ alt: z.string().trim().max(200) }).parse(req.body);
  const media = await Media.findByIdAndUpdate(req.params.id, { alt }, { returnDocument: "after" });
  if (!media) throw new HttpError(404, "Image not found");
  res.json(ok(media));
});

mediaRouter.delete("/:id", async (req, res) => {
  const media = await Media.findById(req.params.id);
  if (!media) throw new HttpError(404, "Image not found");
  const { usages, places } = await findUsages(media.url);
  if (usages.length && req.query.force !== "true") {
    throw new HttpError(409, `This image is still used in ${places.join(", ")}. Replace it there first.`, { usages, places });
  }
  await deleteImage(media.publicId);
  await media.deleteOne();
  res.json(ok({ id: req.params.id, deleted: true }));
});
