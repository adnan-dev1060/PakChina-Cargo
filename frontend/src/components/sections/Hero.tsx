import { motion } from "motion/react";
import { ArrowRight, MessageCircle, Plane, Ship, Truck } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { SmartImage } from "@/components/ui/SmartImage";
import { useResolveHref } from "@/hooks/useContactLinks";
import { useOffices, useShippingModes } from "@/hooks/useContent";
import { cn } from "@/lib/utils";
import type { HeroContent, ShippingModeKey } from "@/types/content";

const MODE_ICON: Record<ShippingModeKey, typeof Ship> = { sea: Ship, air: Plane, road: Truck };
const MODE_LABEL: Record<ShippingModeKey, string> = { sea: "By sea", air: "By air", road: "By road" };
const EASE = [0.22, 1, 0.36, 1] as const;

export function Hero({ hero }: { hero: HeroContent }) {
  const resolve = useResolveHref();
  const secondaryHref = resolve(hero.secondaryCta.href);

  return (
    <section className="relative isolate flex min-h-[640px] flex-col overflow-hidden bg-navy-950 lg:min-h-[min(100svh,880px)]">
      <SmartImage src={hero.imageUrl} alt={hero.imageAlt} priority className="absolute inset-0 -z-20 size-full" />
      {/* Navy wash: solid behind the text, opening up to the photo on the right and fading into the route band. */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-linear-to-r from-navy-950/95 via-navy-950/65 to-navy-950/5" />
      {/* On narrow screens the text spans the whole photo, so darken all of it. */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-navy-950/55 lg:hidden" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-linear-to-t from-navy-950 via-navy-950/40 to-transparent" />

      <div className="container-page flex flex-1 items-center pt-32 pb-12 sm:pt-36 lg:pb-14">
        <div className="max-w-5xl">
          {hero.eyebrow && <p className="mb-5 text-base font-medium text-navy-200">{hero.eyebrow}</p>}
          <h1 className="text-[2.6rem] leading-[1.02] font-extrabold tracking-[-0.025em] text-balance text-white sm:text-6xl lg:text-[4.5rem]">
            {hero.title}
            {hero.highlight && (
              <>
                {" "}
                <span className="block">{hero.highlight}</span>
              </>
            )}
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-relaxed text-pretty text-navy-100">{hero.subtitle}</p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href={resolve(hero.primaryCta.href)} size="lg">
              {hero.primaryCta.label} <ArrowRight className="size-4.5" aria-hidden />
            </ButtonLink>
            <ButtonLink href={secondaryHref} variant="outline-light" size="lg">
              {hero.secondaryCta.href === "whatsapp" && <MessageCircle className="size-5" aria-hidden />}
              {hero.secondaryCta.label}
            </ButtonLink>
          </div>
        </div>
      </div>

      <RouteLine />
    </section>
  );
}

/**
 * China ──▶ Pakistan, with the transit time of each shipping mode on its own lane.
 * Transit times come from Shipping modes, destination cities from Offices (both set in the admin).
 */
function RouteLine() {
  const { data: modes } = useShippingModes();
  const { data: offices } = useOffices();
  if (!modes?.length) return null;
  const cities = offices?.map((o) => o.city) ?? [];

  return (
    <div className="border-t border-white/10 bg-navy-950/70 backdrop-blur-sm">
      <div className="container-page grid gap-6 py-7 lg:grid-cols-[auto_1fr_auto] lg:items-center lg:gap-10 lg:py-8">
        <Endpoint label="From" place="China" detail="Guangzhou, Yiwu and other supplier cities" />

        <ul className="grid gap-4" aria-label="Transit times">
          {modes.map((m, i) => {
            const Icon = MODE_ICON[m.mode];
            return (
              <li key={m.id} className="flex items-center gap-3 sm:gap-4">
                <Icon className="size-5 shrink-0 text-gold-400" aria-hidden />
                <span className="w-16 shrink-0 text-sm font-semibold text-navy-100">{MODE_LABEL[m.mode]}</span>
                {/* The lane itself: drawn once on load, left to right like a shipment moving. */}
                <span aria-hidden className="relative hidden h-px flex-1 sm:block">
                  <motion.span
                    className={cn(
                      "absolute inset-0 origin-left",
                      m.mode === "air" ? "border-t border-dashed border-white/40" : "bg-signal-500",
                    )}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 1.1, delay: 0.3 + i * 0.25, ease: EASE }}
                  />
                  <span className="absolute top-1/2 -right-1 size-2 -translate-y-1/2 rotate-45 border-t border-r border-white/60" />
                </span>
                <span className="ml-auto font-wide text-lg font-bold whitespace-nowrap text-white sm:ml-0 sm:text-xl">{m.transitTime}</span>
              </li>
            );
          })}
        </ul>

        <Endpoint label="To" place="Pakistan" detail={cities.length ? cities.join(", ") : undefined} align="end" />
      </div>
    </div>
  );
}

function Endpoint({ label, place, detail, align = "start" }: { label: string; place: string; detail?: string; align?: "start" | "end" }) {
  return (
    <div className={cn("flex items-baseline gap-3 lg:block", align === "end" && "lg:text-right")}>
      <p className="text-sm text-navy-300">{label}</p>
      <div>
        <p className="font-wide text-2xl leading-none font-extrabold text-white lg:mt-1 lg:text-3xl">{place}</p>
        {detail && <p className="mt-1.5 text-sm text-navy-200">{detail}</p>}
      </div>
    </div>
  );
}
