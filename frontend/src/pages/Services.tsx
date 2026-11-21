import { ArrowRight, Check } from "lucide-react";
import { CtaBand } from "@/components/sections/HomeSections";
import { ButtonLink } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Reveal } from "@/components/ui/Reveal";
import { Seo } from "@/components/ui/Seo";
import { SmartImage } from "@/components/ui/SmartImage";
import { EmptyState, ErrorState, SkeletonGrid } from "@/components/ui/States";
import { useHome, useServices } from "@/hooks/useContent";
import { getIcon } from "@/lib/icons";
import { IMAGES } from "@/content/seed";
import { cn } from "@/lib/utils";

export default function ServicesPage() {
  const { data: services, isLoading, isError, refetch } = useServices();
  const { data: home } = useHome();

  return (
    <>
      <Seo
        title="Services"
        description="Sea freight, air freight, customs clearance, warehousing, sourcing and door-to-door delivery from China to Pakistan."
      />
      <PageHeader
        eyebrow="Our services"
        title="Logistics from China to Pakistan, handled end to end"
        subtitle="Choose a single service or let us manage the whole journey — from your supplier's door to yours."
        imageUrl={IMAGES.containers}
        crumbs={[{ label: "Services" }]}
      />

      <section className="py-20 lg:py-28">
        <div className="container-page">
          {isLoading ? (
            <SkeletonGrid count={6} />
          ) : isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : !services?.length ? (
            <EmptyState message="Services will be listed here soon." />
          ) : (
            <div className="space-y-20 lg:space-y-28">
              {services.map((s, i) => {
                const Icon = getIcon(s.icon);
                const flip = i % 2 === 1;
                return (
                  <Reveal key={s.id}>
                    <article id={s.slug} className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                      <div className={cn(flip && "lg:order-2")}>
                        <SmartImage src={s.imageUrl} alt={s.title} sizes="(min-width: 1024px) 50vw, 100vw" className="aspect-[16/11] w-full rounded-lg" />
                      </div>
                      <div>
                        <span className="flex size-12 items-center justify-center rounded-xl bg-navy-50 text-navy-700">
                          <Icon className="size-6" aria-hidden />
                        </span>
                        <h2 className="mt-5 text-3xl font-extrabold">{s.title}</h2>
                        <p className="mt-4 text-lg leading-relaxed text-slate-600">{s.summary}</p>
                        <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
                          {s.features.map((f) => (
                            <li key={f} className="flex items-start gap-2.5 text-sm text-navy-900">
                              <Check className="mt-0.5 size-4 shrink-0 text-gold-600" aria-hidden /> {f}
                            </li>
                          ))}
                        </ul>
                        <ButtonLink href={`/services/${s.slug}`} variant="navy" className="mt-8">
                          Read more <ArrowRight className="size-4" aria-hidden />
                        </ButtonLink>
                      </div>
                    </article>
                  </Reveal>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {home && <CtaBand title={home.cta.title} body={home.cta.body} />}
    </>
  );
}
