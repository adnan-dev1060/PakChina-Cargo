/**
 * Cloudinary delivery helpers. Images uploaded through the admin are stored once at full size;
 * these build URLs that ask Cloudinary for a resized, modern-format (WebP/AVIF), compressed copy.
 * Any other URL (e.g. pasted from elsewhere) is returned unchanged.
 */

/** Widths offered to the browser, which picks the smallest one that fills the space sharply. */
const SRCSET_WIDTHS = [480, 768, 1024, 1440, 1920];

// Only plain upload URLs (".../upload/v123/...") are rewritten, so a URL that already
// carries its own transformation is left alone.
const PLAIN_UPLOAD = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(v\d+\/.+)$/;

export function isCloudinary(url?: string): boolean {
  return !!url && PLAIN_UPLOAD.test(url);
}

/** URL for a copy at most `width` pixels wide (never upscaled). */
export function cloudinaryUrl(url: string, width: number): string {
  const m = PLAIN_UPLOAD.exec(url);
  return m ? `${m[1]}f_auto,q_auto,c_limit,w_${width}/${m[2]}` : url;
}

/** srcset for responsive images, or undefined when the URL isn't a Cloudinary upload. */
export function cloudinarySrcSet(url: string, widths = SRCSET_WIDTHS): string | undefined {
  if (!isCloudinary(url)) return undefined;
  return widths.map((w) => `${cloudinaryUrl(url, w)} ${w}w`).join(", ");
}
