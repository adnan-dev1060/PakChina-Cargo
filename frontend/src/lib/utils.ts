import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** "+923038896424" -> "+92 303 8896424" */
export function formatPhone(number: string) {
  const digits = number.replace(/[^\d+]/g, "");
  const m = digits.match(/^\+92(\d{3})(\d{7})$/);
  return m ? `+92 ${m[1]} ${m[2]}` : number;
}

export function telHref(number: string) {
  return `tel:${number.replace(/[^\d+]/g, "")}`;
}

export function whatsappHref(number: string, message?: string) {
  const digits = number.replace(/\D/g, "");
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digits}${text}`;
}

export function byOrder<T extends { order: number }>(items: T[]) {
  return [...items].sort((a, b) => a.order - b.order);
}

export function publishedOnly<T extends { published: boolean; order: number }>(items: T[]) {
  return byOrder(items.filter((i) => i.published));
}

export function isExternal(href: string) {
  return /^(https?:|mailto:|tel:)/.test(href);
}
