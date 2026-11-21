import { useSettings } from "@/hooks/useContent";
import { formatPhone, telHref, whatsappHref } from "@/lib/utils";

/** Ready-to-use contact links derived from the admin-managed site settings. */
export function useContactLinks() {
  const { data: s } = useSettings();
  const primary = s?.phones[0];
  return {
    settings: s,
    whatsapp: s?.whatsappNumber ? whatsappHref(s.whatsappNumber, s.whatsappMessage) : undefined,
    whatsappWith: (message: string) => (s?.whatsappNumber ? whatsappHref(s.whatsappNumber, message) : undefined),
    primaryPhone: primary ? { label: formatPhone(primary.number), href: telHref(primary.number) } : undefined,
    phones: (s?.phones ?? []).map((p) => ({ ...p, display: formatPhone(p.number), href: telHref(p.number) })),
  };
}

/** Resolves CTA hrefs stored in content; the keyword "whatsapp" becomes the WhatsApp link. */
export function useResolveHref() {
  const { whatsapp } = useContactLinks();
  return (href: string) => (href === "whatsapp" ? (whatsapp ?? "/contact") : href);
}
