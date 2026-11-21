/**
 * Content service. Every page reads data through these functions only.
 * With VITE_API_URL set they call the REST API; otherwise they return the
 * bundled seed content, so the public site works before the backend exists.
 */
import * as seed from "@/content/seed";
import { API_URL, isApiEnabled } from "@/lib/config";
import { publishedOnly } from "@/lib/utils";
import type {
  AboutContent,
  CargoRoute,
  Commodity,
  Faq,
  Highlight,
  HomeContent,
  InquiryInput,
  Office,
  ProcessStep,
  Service,
  ShippingMode,
  SiteSettings,
  Testimonial,
  TestimonialInput,
  UpdatePost,
} from "@/types/content";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}/api/v1${path}`, {
    credentials: "include",
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(body?.message ?? "Something went wrong. Please try again.", res.status);
  }
  return (body?.data ?? body) as T;
}

function fromSeedOrApi<T>(path: string, fallback: () => T): Promise<T> {
  return isApiEnabled ? request<T>(path) : Promise.resolve(fallback());
}

export const contentApi = {
  settings: () => fromSeedOrApi<SiteSettings>("/settings", () => seed.siteSettings),
  home: () => fromSeedOrApi<HomeContent>("/home", () => seed.home),
  about: () => fromSeedOrApi<AboutContent>("/about", () => seed.about),
  offices: () => fromSeedOrApi<Office[]>("/offices", () => publishedOnly(seed.offices)),
  shippingModes: () => fromSeedOrApi<ShippingMode[]>("/shipping-modes", () => publishedOnly(seed.shippingModes)),
  services: () => fromSeedOrApi<Service[]>("/services", () => publishedOnly(seed.services)),
  service: (slug: string) =>
    fromSeedOrApi<Service | null>(`/services/${encodeURIComponent(slug)}`, () =>
      publishedOnly(seed.services).find((s) => s.slug === slug) ?? null,
    ),
  routes: () => fromSeedOrApi<CargoRoute[]>("/routes", () => publishedOnly(seed.cargoRoutes)),
  commodities: () => fromSeedOrApi<Commodity[]>("/commodities", () => publishedOnly(seed.commodities)),
  processSteps: () => fromSeedOrApi<ProcessStep[]>("/process-steps", () => publishedOnly(seed.processSteps)),
  highlights: () => fromSeedOrApi<Highlight[]>("/highlights", () => publishedOnly(seed.highlights)),
  testimonials: () => fromSeedOrApi<Testimonial[]>("/testimonials", () => publishedOnly(seed.testimonials)),
  faqs: () => fromSeedOrApi<Faq[]>("/faqs", () => publishedOnly(seed.faqs)),
  updates: () => fromSeedOrApi<UpdatePost[]>("/updates", () => publishedOnly(seed.updates)),
};

export const inquiryApi = {
  /** Only available when the backend is connected. */
  submit: (input: InquiryInput) =>
    request<{ id: string }>("/inquiries", { method: "POST", body: JSON.stringify(input) }),
};

export const testimonialApi = {
  /** Sends a client review. It waits for an admin to approve it before it appears on the site. */
  submit: (input: TestimonialInput) =>
    request<{ received: true }>("/testimonials", { method: "POST", body: JSON.stringify(input) }),
};
