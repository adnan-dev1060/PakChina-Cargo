import type { InquiryInput } from "@/types/content";

export type Role = "super_admin" | "editor";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface MediaItem {
  id: string;
  url: string;
  publicId: string;
  folder: string;
  alt: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
  createdAt: string;
}

export type InquiryStatus = "new" | "in_progress" | "replied" | "closed";

export interface InquiryRecord extends InquiryInput {
  id: string;
  status: InquiryStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
}

export interface Stats {
  newInquiries: number;
  totalInquiries: number;
  services: number;
  routes: number;
  faqs: number;
  testimonials: number;
  /** Reviews sent from the website that wait for approval. */
  pendingTestimonials: number;
  media: number;
  recentInquiries: InquiryRecord[];
}

export const MEDIA_FOLDERS = ["general", "branding", "banners", "services", "about", "testimonials", "updates"] as const;
export type MediaFolder = (typeof MEDIA_FOLDERS)[number];

export const INQUIRY_STATUS_LABEL: Record<InquiryStatus, string> = {
  new: "New",
  in_progress: "In progress",
  replied: "Replied",
  closed: "Closed",
};
