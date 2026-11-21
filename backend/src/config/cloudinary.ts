import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { cloudinaryConfigured, env } from "./env.js";
import { HttpError } from "../utils/http.js";

if (cloudinaryConfigured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

function ensureConfigured() {
  if (!cloudinaryConfigured) {
    throw new HttpError(503, "Image uploads are not configured yet (Cloudinary credentials missing).");
  }
}

/**
 * Turns a Cloudinary failure into a clear error for the admin. The details are logged on the
 * server; the admin sees a short explanation instead of a generic "Internal server error".
 */
function cloudinaryError(err: unknown, action: "upload" | "delete"): HttpError {
  const e = (err ?? {}) as { http_code?: number; message?: string };
  console.error(`Cloudinary ${action} failed:`, e.http_code ?? "", e.message ?? err);
  if (e.http_code === 401 || e.http_code === 403) {
    return new HttpError(
      502,
      `Cloudinary refused the ${action}: the API key in the server settings does not have permission to ${action === "upload" ? "upload" : "delete"} images.`,
    );
  }
  return new HttpError(502, `Cloudinary could not ${action} the image. Please try again.`);
}

export function uploadImage(buffer: Buffer, folder: string): Promise<UploadApiResponse> {
  ensureConfigured();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `${env.CLOUDINARY_FOLDER}/${folder}`, resource_type: "image", overwrite: false },
      (err, result) => (err || !result ? reject(cloudinaryError(err, "upload")) : resolve(result)),
    );
    stream.end(buffer);
  });
}

export async function deleteImage(publicId: string) {
  ensureConfigured();
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "image", invalidate: true });
  } catch (err) {
    throw cloudinaryError(err, "delete");
  }
}
