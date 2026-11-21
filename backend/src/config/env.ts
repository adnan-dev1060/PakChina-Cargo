import "dotenv/config";
import { z } from "zod";

/** All configuration comes from the environment and is validated once at startup. */
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGINS: z
    .string()
    .default("http://localhost:5173")
    .transform((v) => v.split(",").map((s) => s.trim().replace(/\/$/, "")).filter(Boolean)),

  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  /**
   * Optional DNS servers for resolving mongodb+srv:// hosts, e.g. "8.8.8.8,1.1.1.1".
   * Needed on machines where Node's resolver points at an address that refuses SRV lookups.
   */
  DNS_SERVERS: z
    .string()
    .optional()
    .transform((v) => (v ? v.split(",").map((s) => s.trim()).filter(Boolean) : [])),

  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
  ACCESS_TOKEN_TTL_MIN: z.coerce.number().int().positive().default(15),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),
  /** "none" when frontend and API are on different sites in production (requires HTTPS). */
  COOKIE_SAMESITE: z.enum(["lax", "strict", "none"]).default("lax"),
  COOKIE_SECURE: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),

  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  CLOUDINARY_FOLDER: z.string().default("pak-china-cargo"),
  MAX_UPLOAD_MB: z.coerce.number().positive().default(5),

  /** Public address of the website, e.g. https://pakchinacargo.com. Used in the sitemap, canonical links and previews. */
  SITE_URL: z.url({ protocol: /^https?$/ }).optional().or(z.literal("").transform(() => undefined)),
  /** Built website folder, relative to the backend folder. The server serves it when it exists. */
  WEB_DIST: z.string().default("../frontend/dist"),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment configuration:\n" + z.prettifyError(parsed.error));
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === "production";
export const cookieSecure = env.COOKIE_SECURE ?? isProd;
export const cloudinaryConfigured = Boolean(
  env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET,
);
