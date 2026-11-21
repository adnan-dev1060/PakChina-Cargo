/**
 * Serves the built website (frontend/dist) from the API server, so the whole site runs as one
 * service on one domain. Every page's HTML gets that page's title, description, preview image and
 * canonical link filled in on the server, so Google and WhatsApp/Facebook link previews show the
 * right page even though they do not run the site's JavaScript.
 */
import express, { type Request, type Router } from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "../../config/env.js";
import { Office, Service } from "../../models/content.models.js";
import { getSingleton } from "../content/content.routes.js";

interface Settings {
  companyName: string;
  tagline: string;
  shortDescription: string;
  logoUrl: string;
  phones: { label: string; number: string }[];
  email?: string;
  socials: { url: string }[];
  seo: { title: string; description: string; ogImageUrl?: string };
}

interface PageMeta {
  title: string;
  description: string;
  image?: string;
  status: number;
  noindex?: boolean;
  jsonLd?: object;
}

/** Public pages listed in the sitemap (service detail pages are added from the database). */
const STATIC_PAGES = ["/", "/about", "/services", "/routes", "/contact"];

/** Same wording as the <Seo> props in the frontend pages, so the server and browser agree. */
const PAGE_COPY: Record<string, { title: string; description?: string }> = {
  "/services": {
    title: "Services",
    description: "Sea freight, air freight, customs clearance, warehousing, sourcing and door-to-door delivery from China to Pakistan.",
  },
  "/routes": {
    title: "Routes & Destinations",
    description: "China to Pakistan cargo routes by sea and air, delivered through our offices in Lahore, Islamabad and Faisalabad.",
  },
  "/contact": {
    title: "Contact Us",
    description: "Call, WhatsApp or send us your shipment details for a quote. Offices in Lahore, Islamabad and Faisalabad.",
  },
};

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** A 1200px JPEG of a Cloudinary image: the size and format link previews expect. */
function previewImage(url?: string) {
  if (!url) return undefined;
  return /res\.cloudinary\.com\/[^/]+\/image\/upload\/v\d+\//.test(url)
    ? url.replace("/image/upload/", "/image/upload/f_jpg,q_auto,c_limit,w_1200/")
    : url;
}

/** The public address of the site: SITE_URL when set, otherwise the address the request came in on. */
export function siteUrl(req: Request) {
  return (env.SITE_URL ?? `${req.protocol}://${req.get("host")}`).replace(/\/$/, "");
}

async function loadSettings(): Promise<Settings | null> {
  try {
    return (await getSingleton("settings")) as Settings;
  } catch {
    return null;
  }
}

async function organizationLd(settings: Settings, base: string) {
  const offices = await Office.find({ published: true }).sort({ order: 1 }).lean<{ label: string; city: string; address?: string; phone?: string }[]>();
  const phone = settings.phones[0]?.number;
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: settings.companyName,
    description: settings.shortDescription,
    url: base,
    ...(settings.logoUrl ? { logo: new URL(settings.logoUrl, base).href } : {}),
    ...(phone ? { telephone: phone } : {}),
    ...(settings.email ? { email: settings.email } : {}),
    ...(settings.socials.length ? { sameAs: settings.socials.map((s) => s.url) } : {}),
    department: offices.map((o) => ({
      "@type": "LocalBusiness",
      name: `${settings.companyName} — ${o.label}`,
      address: { "@type": "PostalAddress", addressLocality: o.city, addressCountry: "PK", ...(o.address ? { streetAddress: o.address } : {}) },
      ...(o.phone ? { telephone: o.phone } : {}),
    })),
  };
}

async function metaFor(pathname: string, settings: Settings | null, base: string): Promise<PageMeta> {
  const name = settings?.companyName ?? "Pak China Cargo";
  const siteTitle = settings?.seo.title ?? name;
  const siteDesc = settings?.seo.description ?? "";
  // Without a share image set in admin, link previews fall back to the logo.
  const ogImage = settings?.seo.ogImageUrl || (settings?.logoUrl ? new URL(settings.logoUrl, base).href : undefined);
  const page = (title: string, description = siteDesc, image = ogImage, status = 200): PageMeta => ({
    title: `${title} | ${name}`,
    description,
    image,
    status,
  });

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return { title: `Admin | ${name}`, description: "", status: 200, noindex: true };
  }
  if (pathname === "/") {
    return {
      title: siteTitle,
      description: siteDesc,
      image: ogImage,
      status: 200,
      jsonLd: settings ? await organizationLd(settings, base) : undefined,
    };
  }
  if (pathname === "/about") {
    const about = (await getSingleton("about").catch(() => null)) as { intro?: string } | null;
    return page("About Us", about?.intro ?? siteDesc);
  }
  const copy = PAGE_COPY[pathname];
  if (copy) return page(copy.title, copy.description);

  const slug = /^\/services\/([a-z0-9-]+)$/.exec(pathname)?.[1];
  if (slug) {
    const service = await Service.findOne({ slug, published: true }).lean<{ title: string; summary: string; imageUrl?: string }>();
    if (service) return page(service.title, service.summary, service.imageUrl || ogImage);
  }
  return { ...page("Page not found", siteDesc, ogImage, 404), noindex: true };
}

function headTags(meta: PageMeta, url: string, siteName: string) {
  const tags = [
    `<title>${escapeHtml(meta.title)}</title>`,
    `<meta name="description" content="${escapeHtml(meta.description)}" />`,
  ];
  if (meta.noindex) {
    tags.push(`<meta name="robots" content="noindex, nofollow" />`);
  } else {
    const image = previewImage(meta.image);
    tags.push(
      `<link rel="canonical" href="${escapeHtml(url)}" />`,
      `<meta property="og:type" content="website" />`,
      `<meta property="og:site_name" content="${escapeHtml(siteName)}" />`,
      `<meta property="og:title" content="${escapeHtml(meta.title)}" />`,
      `<meta property="og:description" content="${escapeHtml(meta.description)}" />`,
      `<meta property="og:url" content="${escapeHtml(url)}" />`,
      ...(image ? [`<meta property="og:image" content="${escapeHtml(image)}" />`] : []),
      `<meta name="twitter:card" content="summary_large_image" />`,
    );
  }
  // Marked so the browser app can remove them once it renders its own tags (no duplicates).
  const html = tags.map((t) => t.replace(/^<(\w+)/, "<$1 data-server-seo")).join("\n    ");
  const ld = meta.jsonLd
    ? `\n    <script type="application/ld+json">${JSON.stringify(meta.jsonLd).replace(/</g, "\\u003c")}</script>`
    : "";
  return html + ld;
}

/** Returns a router that serves the site, or null when the website has not been built. */
export function createSiteRouter(): Router | null {
  // WEB_DIST is relative to the backend folder (src/ in development, dist/ when built: both 3 levels up).
  const backendRoot = fileURLToPath(new URL("../../../", import.meta.url));
  const dist = path.resolve(backendRoot, env.WEB_DIST);
  const indexFile = path.join(dist, "index.html");
  if (!fs.existsSync(indexFile)) return null;

  // Drop the build's placeholder <title> and description; each response gets its own.
  const template = fs
    .readFileSync(indexFile, "utf8")
    .replace(/\s*<title>[\s\S]*?<\/title>/, "")
    .replace(/\s*<meta name="description"[^>]*>/, "");

  const router = express.Router();

  router.get("/robots.txt", (req, res) => {
    res.type("text/plain").set("Cache-Control", "public, max-age=3600");
    res.send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${siteUrl(req)}/sitemap.xml\n`);
  });

  router.get("/sitemap.xml", async (req, res, next) => {
    try {
      const base = siteUrl(req);
      const services = await Service.find({ published: true }).sort({ order: 1 }).select("slug updatedAt").lean<{ slug: string; updatedAt?: Date }[]>();
      const entries: { loc: string; lastmod?: string }[] = [
        ...STATIC_PAGES.map((p) => ({ loc: `${base}${p === "/" ? "/" : p}` })),
        ...services.map((s) => ({ loc: `${base}/services/${s.slug}`, lastmod: s.updatedAt?.toISOString().slice(0, 10) })),
      ];
      const xml = entries
        .map((e) => `  <url><loc>${escapeHtml(e.loc)}</loc>${e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ""}</url>`)
        .join("\n");
      res.type("application/xml").set("Cache-Control", "public, max-age=3600");
      res.send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${xml}\n</urlset>\n`);
    } catch (err) {
      next(err);
    }
  });

  // Build files: hashed names under /assets never change, so browsers may keep them for a year.
  router.use(
    express.static(dist, {
      index: false,
      setHeaders: (res, file) => {
        res.setHeader(
          "Cache-Control",
          file.includes(`${path.sep}assets${path.sep}`) ? "public, max-age=31536000, immutable" : "public, max-age=3600",
        );
      },
    }),
  );

  // Every other page address returns the app, with that page's tags.
  router.get(/^(?!\/api\/).*/, async (req, res, next) => {
    try {
      const pathname = req.path.length > 1 ? req.path.replace(/\/+$/, "") : "/";
      const base = siteUrl(req);
      const settings = await loadSettings();
      const meta = await metaFor(pathname, settings, base);
      const html = template.replace(
        "</head>",
        `    ${headTags(meta, `${base}${pathname === "/" ? "/" : pathname}`, settings?.companyName ?? "Pak China Cargo")}\n  </head>`,
      );
      res.status(meta.status).type("html").set("Cache-Control", "no-cache").send(html);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
