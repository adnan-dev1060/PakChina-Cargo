import { cloudinaryUrl } from "@/lib/images";
import { useLocation } from "react-router-dom";
import { useSettings } from "@/hooks/useContent";
import { SITE_URL } from "@/lib/config";

interface Props {
  title?: string;
  description?: string;
  image?: string;
}

/**
 * Per-page metadata. React 19 hoists <title>, <meta> and <link> into <head>.
 */
export function Seo({ title, description, image }: Props) {
  const { data: settings } = useSettings();
  const { pathname } = useLocation();
  const name = settings?.companyName ?? "Pak China Cargo";
  const fullTitle = title ? `${title} | ${name}` : (settings?.seo.title ?? name);
  const desc = description ?? settings?.seo.description ?? "";
  const url = SITE_URL ? `${SITE_URL}${pathname}` : undefined;
  const rawImg = image ?? settings?.seo.ogImageUrl;
  // Link previews (WhatsApp, Facebook) want ~1200px wide; never send the full-size original.
  const img = rawImg ? cloudinaryUrl(rawImg, 1200) : undefined;

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={name} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      {img && <meta property="og:image" content={img} />}
      {url && <meta property="og:url" content={url} />}
      {url && <link rel="canonical" href={url} />}
      <meta name="twitter:card" content="summary_large_image" />
    </>
  );
}
