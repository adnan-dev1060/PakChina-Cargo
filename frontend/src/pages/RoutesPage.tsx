import { ArrowRight, Clock, MapPin, Plane, Ship, Truck } from "lucide-react";
import { CtaBand } from "@/components/sections/HomeSections";
import { RouteNetwork } from "@/components/sections/RouteNetwork";
import { ButtonLink } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Seo } from "@/components/ui/Seo";
import { EmptyState, ErrorState, SkeletonGrid } from "@/components/ui/States";
import { IMAGES } from "@/content/seed";
import { useHome, useRoutes } from "@/hooks/useContent";
import type { ShippingModeKey } from "@/types/content";

const MODE = {
  sea: { icon: Ship, label: "Sea" },
  air: { icon: Plane, label: "Air" },
  road: { icon: Truck, label: "Road" },
} satisfies Record<ShippingModeKey, { icon: typeof Ship; label: string }>;

export default function RoutesPage() {
  const { data: routes, isLoading, isError, refetch } = useRoutes();
  const { data: home } = useHome();

  return (
    <>
      <Seo
        title="Routes & Destinations"
        description="China to Pakistan cargo routes by sea and air, delivered through our offices in Lahore, Islamabad and Faisalabad."
      />
      <PageHeader
        eyebrow="Routes & destinations"
        title="China to Pakistan, by sea and by air"
        subtitle="Regular shipments from China delivered through our offices — with door-to-door delivery across Pakistan."
        imageUrl={IMAGES.portCranes}
        crumbs={[{ label: "Routes" }]}
      />

      <section className="bg-surface py-20 lg:py-24">
        <div className="container-page grid items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading
              eyebrow="Our network"
              title="One origin, delivered across Pakistan"
              subtitle="Cargo is collected from suppliers across China and shipped by air or sea to our offices, then delivered to your door."
            />
            <ul className="mt-8 space-y-3 text-slate-700">
              {["Collection from your supplier in China", "Customs clearance handled by our team", "Door-to-door delivery from our offices"].map((t) => (
                <li key={t} className="flex items-center gap-3">
                  <span className="size-1.5 shrink-0 rounded-full bg-gold-500" aria-hidden /> {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="mx-auto w-full max-w-xl">
            <RouteNetwork />
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-28">
        <div className="container-page">
          <SectionHeading eyebrow="Destinations" title="Where we deliver" subtitle="Transit times are typical estimates and depend on schedules and customs clearance." />
          <div className="mt-12">
            {isLoading ? (
              <SkeletonGrid count={3} />
            ) : isError ? (
              <ErrorState onRetry={() => refetch()} />
            ) : !routes?.length ? (
              <EmptyState message="Routes will be published here soon." />
            ) : (
              <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {routes.map((r, i) => (
                  <Reveal as="li" key={r.id} delay={i * 0.06} className="flex flex-col rounded-lg border border-line p-7">
                    <div className="flex items-center gap-3 font-display text-lg font-bold text-navy-900">
                      <span>{r.origin}</span>
                      <ArrowRight className="size-4 text-gold-600" aria-hidden />
                      <span>{r.destination}</span>
                    </div>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                      <MapPin className="size-3.5" aria-hidden /> {r.originCountry} → {r.destinationCountry}
                    </p>
                    <p className="mt-4 flex-1 text-sm leading-relaxed text-slate-600">{r.description}</p>
                    <dl className="mt-6 grid grid-cols-2 gap-3 border-t border-line pt-5">
                      {r.legs.map((leg) => {
                        const { icon: Icon, label } = MODE[leg.mode];
                        return (
                          <div key={leg.mode} className="rounded-lg bg-surface p-3">
                            <dt className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                              <Icon className="size-3.5" aria-hidden /> {label}
                            </dt>
                            <dd className="mt-1 flex items-center gap-1.5 text-sm font-bold text-navy-900">
                              <Clock className="size-3.5 text-navy-400" aria-hidden /> {leg.transitTime}
                            </dd>
                          </div>
                        );
                      })}
                    </dl>
                  </Reveal>
                ))}
              </ul>
            )}
          </div>
          <div className="mt-12 flex flex-col items-start gap-4 rounded-lg bg-gold-100 p-7 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-display text-lg font-bold text-navy-900">Your city isn't listed? We deliver door-to-door across Pakistan.</p>
            <ButtonLink href="/contact#quote" variant="navy">
              Ask about your city <ArrowRight className="size-4" aria-hidden />
            </ButtonLink>
          </div>
        </div>
      </section>

      {home && <CtaBand title={home.cta.title} body={home.cta.body} />}
    </>
  );
}
