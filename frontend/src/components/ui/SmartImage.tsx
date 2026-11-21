import { ImageOff } from "lucide-react";
import { useState } from "react";
import { cloudinarySrcSet, cloudinaryUrl, isCloudinary } from "@/lib/images";
import { cn } from "@/lib/utils";

interface Props {
  src?: string;
  alt: string;
  className?: string;
  /** Above-the-fold images: load eagerly and skip the fade-in. */
  priority?: boolean;
  /**
   * How wide the image is shown, for picking a resized copy (HTML `sizes`),
   * e.g. "(min-width: 1024px) 50vw, 100vw". Defaults to the full screen width.
   */
  sizes?: string;
}

/**
 * Lazy image with a soft fade-in and a branded fallback when the URL is missing or fails to load.
 * Cloudinary uploads are served resized for the visitor's screen instead of at full size.
 */
export function SmartImage({ src, alt, className, priority, sizes = "100vw" }: Props) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);

  if (!src || failedSrc === src) {
    return (
      <div role="img" aria-label={alt} className={cn("flex items-center justify-center bg-navy-50 text-navy-300", className)}>
        <ImageOff className="size-8" aria-hidden />
      </div>
    );
  }

  const visible = priority || loadedSrc === src;

  return (
    <img
      // If the image is already cached, onLoad may fire before hydration — check on mount too.
      ref={(el) => {
        if (el?.complete && el.naturalWidth > 0 && loadedSrc !== src) setLoadedSrc(src);
      }}
      src={isCloudinary(src) ? cloudinaryUrl(src, 1440) : src}
      srcSet={cloudinarySrcSet(src)}
      sizes={isCloudinary(src) ? sizes : undefined}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      onLoad={() => setLoadedSrc(src)}
      onError={() => setFailedSrc(src)}
      style={{ opacity: visible ? 1 : 0, transition: "opacity 500ms ease, transform 700ms ease" }}
      className={cn("bg-navy-50 object-cover", className)}
    />
  );
}
