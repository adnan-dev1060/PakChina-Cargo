/**
 * VITE_API_URL: where the API lives.
 * - empty: no backend; the site renders the bundled seed content.
 * - "/": the API is on the same server as the website (the production setup).
 * - a full URL (e.g. http://localhost:4000): a separate API server, as in development.
 */
const rawApiUrl = ((import.meta.env.VITE_API_URL as string | undefined) ?? "").trim();
export const API_URL = rawApiUrl.replace(/\/$/, "");
export const isApiEnabled = rawApiUrl.length > 0;

/** Public site address for canonical links; defaults to wherever the site is being viewed. */
export const SITE_URL =
  ((import.meta.env.VITE_SITE_URL as string | undefined) ?? "").replace(/\/$/, "") ||
  (typeof window !== "undefined" ? window.location.origin : "");
