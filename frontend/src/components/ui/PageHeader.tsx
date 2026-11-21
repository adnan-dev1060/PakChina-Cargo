import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { SmartImage } from "./SmartImage";

interface Props {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  crumbs?: { label: string; href?: string }[];
  /** Fill the screen like the homepage hero, with the photo at full strength. */
  full?: boolean;
}

/** Navy banner at the top of inner pages, with optional photo and breadcrumbs. */
export function PageHeader({ eyebrow, title, subtitle, imageUrl, crumbs = [], full = false }: Props) {
  return (
    <section className={cn("relative isolate overflow-hidden bg-navy-950", full && "flex min-h-[600px] flex-col lg:min-h-[min(100svh,880px)]")}>
      {imageUrl && full && (
        <>
          <SmartImage src={imageUrl} alt="" priority className="absolute inset-0 -z-20 size-full" />
          {/* Same treatment as the homepage hero: dark behind the text, opening up to the photo. */}
          <div aria-hidden className="absolute inset-0 -z-10 bg-linear-to-r from-navy-950/95 via-navy-950/65 to-navy-950/10" />
          <div aria-hidden className="absolute inset-0 -z-10 bg-navy-950/45 lg:hidden" />
          <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-linear-to-t from-navy-950/90 to-transparent" />
        </>
      )}
      {imageUrl && !full && (
        <>
          <SmartImage src={imageUrl} alt="" priority className="absolute inset-0 -z-20 size-full opacity-35" />
          <div aria-hidden className="absolute inset-0 -z-10 bg-linear-to-r from-navy-950 via-navy-950/90 to-navy-950/40" />
        </>
      )}
      {/* Top padding clears the fixed, transparent header that sits over this banner. */}
      <div className={cn("container-page pt-32 pb-16 sm:pt-36 sm:pb-20 lg:pb-24", full && "mt-auto pb-20 sm:pb-24 lg:pb-28")}>
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm text-navy-200">
            <li>
              <Link to="/" className="-my-2 inline-block py-2 hover:text-white">Home</Link>
            </li>
            {crumbs.map((c) => (
              <li key={c.label} className="flex items-center gap-1.5">
                <ChevronRight className="size-3.5" aria-hidden />
                {c.href ? (
                  <Link to={c.href} className="-my-2 inline-block py-2 hover:text-white">{c.label}</Link>
                ) : (
                  <span aria-current="page" className="text-white">{c.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
        {eyebrow && <p className="mb-3 text-base font-medium text-navy-200">{eyebrow}</p>}
        <h1 className={cn("max-w-3xl text-4xl leading-[1.05] font-extrabold tracking-[-0.02em] text-balance text-white sm:text-5xl lg:text-6xl", full && "max-w-4xl text-[2.6rem] sm:text-6xl lg:text-[4.5rem] lg:leading-[1.02]")}>{title}</h1>
        {subtitle && <p className="mt-5 max-w-2xl text-lg leading-relaxed text-navy-100">{subtitle}</p>}
      </div>
    </section>
  );
}
