import { ArrowRight, ArrowUpRight, Check, MessageCircle, PenLine, Phone, Quote, Star } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { ReviewForm } from "@/components/forms/ReviewForm";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SmartImage } from "@/components/ui/SmartImage";
import { ErrorState, SkeletonGrid } from "@/components/ui/States";
import { IMAGES } from "@/content/seed";
import { useContactLinks } from "@/hooks/useContactLinks";
import {
  useCommodities,
  useHighlights,
  useProcessSteps,
  useServices,
  useShippingModes,
  useTestimonials,
  useUpdates,
} from "@/hooks/useContent";
import { isApiEnabled } from "@/lib/config";
import { getIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import type { HomeContent, HomeSection } from "@/types/content";
import { FaqList } from "./FaqList";
import { RouteNetwork } from "./RouteNetwork";

type SectionProps = { section: HomeSection; home: HomeContent };

/* ----------------------------- Intro ----------------------------- */
export function IntroSection({ section, home }: SectionProps) {
  const { intro } = home;
  return (
    <section className="py-20 lg:py-28">
      <div className="container-page grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <Reveal>
          <SectionHeading eyebrow={section.eyebrow} title={section.title} subtitle={section.subtitle} />
          <div className="mt-6 space-y-4 text-base leading-relaxed text-slate-600">
            {intro.body.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {intro.points.map((pt) => (
              <li key={pt} className="flex items-center gap-2.5 border-t border-line pt-3 text-sm font-semibold text-navy-900">
                <Check className="size-4 shrink-0 text-gold-600" strokeWidth={3} aria-hidden />
                {pt}
              </li>
            ))}
          </ul>
          <ButtonLink href="/about" variant="outline" className="mt-9">
            More about us <ArrowRight className="size-4" aria-hidden />
          </ButtonLink>
        </Reveal>
        <Reveal>
          <SmartImage src={intro.imageUrl} alt={intro.imageAlt} sizes="(min-width: 1024px) 50vw, 100vw" className="aspect-[4/3] w-full rounded-lg" />
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------- Shipping modes ------------------------- */
export function ModesSection({ section }: SectionProps) {
  const { data, isLoading, isError, refetch } = useShippingModes();
  return (
    <section className="bg-surface py-20 lg:py-28">
      <div className="container-page">
        <SectionHeading eyebrow={section.eyebrow} title={section.title} subtitle={section.subtitle} />
        <div className="mt-12">
          {isLoading ? (
            <SkeletonGrid count={2} className="lg:grid-cols-2" />
          ) : isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {data?.map((m, i) => (
                <Reveal key={m.id} delay={i * 0.08}>
                  <article className="group grid h-full overflow-hidden rounded-lg border border-line bg-white sm:grid-cols-5">
                    <div className="relative overflow-hidden sm:col-span-2">
                      <SmartImage
                        src={m.imageUrl}
                        alt=""
                        sizes="(min-width: 1024px) 20vw, (min-width: 640px) 40vw, 100vw"
                        className="h-52 w-full transition-transform duration-700 group-hover:scale-105 sm:h-full"
                      />
                    </div>
                    <div className="flex flex-col p-7 sm:col-span-3">
                      <h3 className="text-xl font-bold">{m.title}</h3>
                      <p className="mt-2 font-wide text-4xl font-extrabold text-navy-900">
                        {m.transitTime}
                      </p>
                      <p className="mt-3 text-sm leading-relaxed text-slate-600">{m.summary}</p>
                      <p className="mt-5 text-sm font-semibold text-slate-500">Best for</p>
                      <ul className="mt-2 space-y-1.5">
                        {m.bestFor.map((b) => (
                          <li key={b} className="flex items-center gap-2 text-sm text-navy-900">
                            <Check className="size-4 text-gold-600" aria-hidden /> {b}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------- Services ---------------------------- */
export function ServicesSection({ section }: SectionProps) {
  const { data, isLoading, isError, refetch } = useServices();
  return (
    <section className="py-20 lg:py-28">
      <div className="container-page">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading eyebrow={section.eyebrow} title={section.title} subtitle={section.subtitle} />
          <ButtonLink href="/services" variant="outline" className="self-start md:self-auto">
            All services <ArrowRight className="size-4" aria-hidden />
          </ButtonLink>
        </div>
        <div className="mt-12">
          {isLoading ? (
            <SkeletonGrid count={6} />
          ) : isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : (
            <ul className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
              {data?.map((s) => {
                const Icon = getIcon(s.icon);
                return (
                  <li key={s.id} className="bg-white">
                    <Link
                      to={`/services/${s.slug}`}
                      className="group flex h-full flex-col p-8 transition-colors hover:bg-surface"
                    >
                      <Icon className="size-7 text-navy-600" strokeWidth={1.75} aria-hidden />
                      <h3 className="mt-6 text-lg font-bold group-hover:underline group-hover:decoration-gold-500 group-hover:decoration-2 group-hover:underline-offset-4">
                        {s.title}
                      </h3>
                      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{s.summary}</p>
                      <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-navy-700">
                        Read about {s.title.toLowerCase()} <ArrowUpRight className="size-4" aria-hidden />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

/* ----------------------------- Routes ----------------------------- */
export function RoutesSection({ section }: SectionProps) {
  return (
    <section className="relative overflow-hidden bg-navy-950 py-20 lg:py-28">
      <div className="container-page grid items-center gap-12 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <SectionHeading eyebrow={section.eyebrow} title={section.title} subtitle={section.subtitle} tone="dark" />
          <ButtonLink href="/routes" variant="primary" className="mt-8">
            View routes <ArrowRight className="size-4" aria-hidden />
          </ButtonLink>
        </div>
        <div className="lg:col-span-3">
          <RouteNetwork />
        </div>
      </div>
    </section>
  );
}

/* --------------------------- Commodities --------------------------- */
export function CommoditiesSection({ section }: SectionProps) {
  const { data, isLoading, isError, refetch } = useCommodities();
  if (!isLoading && !isError && !data?.length) return null;
  return (
    <section className="py-20 lg:py-28">
      <div className="container-page">
        <SectionHeading eyebrow={section.eyebrow} title={section.title} subtitle={section.subtitle} align="center" />
        <div className="mt-12">
          {isLoading ? (
            <SkeletonGrid count={4} className="lg:grid-cols-4" />
          ) : isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : (
            <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {data?.map((c, i) => {
                const Icon = getIcon(c.icon);
                return (
                  <Reveal as="li" key={c.id} delay={i * 0.05} className="flex h-full flex-col items-center rounded-lg border border-line px-4 py-8 text-center">
                      <Icon className="size-8 text-navy-600" strokeWidth={1.6} aria-hidden />
                      <h3 className="mt-4 text-base font-bold">{c.title}</h3>
                      {c.titleUrdu && (
                        <p lang="ur" className="urdu mt-1 text-sm text-slate-500">
                          {c.titleUrdu}
                        </p>
                      )}
                      {c.note && <p className="mt-2 text-xs text-slate-500">{c.note}</p>}
                    </Reveal>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

/* ----------------------------- Process ----------------------------- */
export function ProcessSection({ section }: SectionProps) {
  const { data, isLoading, isError, refetch } = useProcessSteps();
  if (!isLoading && !isError && !data?.length) return null;
  return (
    <section className="bg-surface py-20 lg:py-28">
      <div className="container-page">
        <SectionHeading eyebrow={section.eyebrow} title={section.title} subtitle={section.subtitle} />
        <div className="mt-12">
          {isLoading ? (
            <SkeletonGrid count={4} className="lg:grid-cols-4" />
          ) : isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : (
            <ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
              {data?.map((s, i) => {
                const Icon = getIcon(s.icon);
                return (
                  <Reveal as="li" key={s.id} delay={i * 0.08} className="relative">
                      {/* The steps are a real sequence, so they are numbered and joined like route legs. */}
                      <div className="flex items-center gap-4">
                        <span className="font-wide text-5xl leading-none font-extrabold text-navy-900" aria-label={`Step ${i + 1}`}>
                          {i + 1}
                        </span>
                        <Icon className="size-6 text-gold-600" aria-hidden />
                        {i < (data?.length ?? 0) - 1 && (
                          <span aria-hidden className="hidden h-px flex-1 bg-signal-500/60 lg:block" />
                        )}
                      </div>
                      <h3 className="mt-6 text-lg font-bold">{s.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.description}</p>
                    </Reveal>
                );
              })}
            </ol>
          )}
        </div>
      </div>
    </section>
  );
}

/* ----------------------------- Why us ----------------------------- */
export function WhyUsSection({ section }: SectionProps) {
  const { data, isLoading, isError, refetch } = useHighlights();
  if (!isLoading && !isError && !data?.length) return null;
  return (
    <section className="py-20 lg:py-28">
      <div className="container-page grid gap-12 lg:grid-cols-3">
        <SectionHeading eyebrow={section.eyebrow} title={section.title} subtitle={section.subtitle} />
        <div className="lg:col-span-2">
          {isLoading ? (
            <SkeletonGrid count={4} className="lg:grid-cols-2" />
          ) : isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : (
            <ul className="grid gap-x-10 gap-y-10 sm:grid-cols-2">
              {data?.map((h, i) => {
                const Icon = getIcon(h.icon);
                return (
                  <Reveal as="li" key={h.id} delay={i * 0.06} className="border-l-2 border-gold-500 pl-6">
                      <Icon className="size-6 text-navy-700" aria-hidden />
                      <h3 className="mt-4 text-lg font-bold">{h.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">{h.description}</p>
                    </Reveal>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

/* --------------------------- Testimonials --------------------------- */
export function TestimonialsSection({ section }: SectionProps) {
  const { data } = useTestimonials();
  const [writing, setWriting] = useState(false);
  // Without the backend there is nowhere to send a review, so an empty section stays hidden.
  if (!data?.length && !isApiEnabled) return null;
  return (
    <section id="reviews" className="scroll-mt-24 bg-surface py-20 lg:py-28">
      <div className="container-page">
        <SectionHeading eyebrow={section.eyebrow} title={section.title} subtitle={section.subtitle} align="center" />
        {!data?.length && <p className="mt-6 text-center text-slate-600">Shipped with us? Be the first to share how it went.</p>}
        {/* Centred rows, so one or two reviews don't sit off to the left. */}
        <ul className="mt-12 flex flex-wrap justify-center gap-6">
          {(data ?? []).map((t) => (
            <li key={t.id} className="flex w-full flex-col rounded-lg border border-line bg-white p-7 md:w-[calc(50%-0.75rem)] lg:w-[calc((100%-3rem)/3)]">
              <Quote className="size-7 text-gold-500" aria-hidden />
              {t.rating ? (
                <div className="mt-4 flex gap-0.5" aria-label={`${t.rating} out of 5`}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} className={cn("size-4", i < t.rating! ? "fill-gold-500 text-gold-500" : "text-line")} aria-hidden />
                  ))}
                </div>
              ) : null}
              <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-slate-700">“{t.quote}”</blockquote>
              <footer className="mt-6 flex items-center gap-3 border-t border-line pt-5">
                {t.avatarUrl ? (
                  <img src={t.avatarUrl} alt="" className="size-10 rounded-full object-cover" loading="lazy" />
                ) : (
                  <span className="flex size-10 items-center justify-center rounded-full bg-navy-800 text-sm font-bold text-white">
                    {t.name.charAt(0)}
                  </span>
                )}
                <div>
                  <p className="text-sm font-bold text-navy-900">{t.name}</p>
                  <p className="text-xs text-slate-500">{[t.company, t.city].filter(Boolean).join(", ")}</p>
                </div>
              </footer>
            </li>
          ))}
        </ul>
        {isApiEnabled && (
          <div className="mx-auto mt-12 max-w-3xl text-center">
            {writing ? (
              <ReviewForm onDone={() => setWriting(false)} />
            ) : (
              <Button variant="navy" size="lg" onClick={() => setWriting(true)}>
                <PenLine className="size-4.5" aria-hidden /> Share your experience
              </Button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/* ------------------------------- FAQ ------------------------------- */
export function FaqSection({ section }: SectionProps) {
  return (
    <section className="py-20 lg:py-28">
      <div className="container-page grid gap-12 lg:grid-cols-3">
        <div>
          <SectionHeading eyebrow={section.eyebrow} title={section.title} subtitle={section.subtitle} />
          <p className="mt-6 text-sm text-slate-600">
            Can't find your answer?{" "}
            <Link to="/contact" className="font-semibold text-navy-700 underline underline-offset-4 hover:text-navy-900">
              Contact our team
            </Link>
            .
          </p>
        </div>
        <div className="lg:col-span-2">
          <FaqList />
        </div>
      </div>
    </section>
  );
}

/* ----------------------------- Updates ----------------------------- */
export function UpdatesSection({ section }: SectionProps) {
  const { data } = useUpdates();
  if (!data?.length) return null;
  return (
    <section className="bg-surface py-20 lg:py-28">
      <div className="container-page">
        <SectionHeading eyebrow={section.eyebrow} title={section.title} subtitle={section.subtitle} />
        <ul className="mt-12 flex flex-wrap justify-center gap-6">
          {data.slice(0, 3).map((u) => {
            const inner = (
              <>
                <SmartImage src={u.imageUrl} alt="" sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" className="aspect-[16/10] w-full" />
                <div className="p-6">
                  <time dateTime={u.publishedAt} className="text-xs font-semibold text-slate-500">
                    {new Date(u.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                  </time>
                  <h3 className="mt-2 text-lg font-bold">{u.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{u.excerpt}</p>
                </div>
              </>
            );
            return (
              <li key={u.id} className="w-full overflow-hidden rounded-lg border border-line bg-white md:w-[calc(50%-0.75rem)] lg:w-[calc((100%-3rem)/3)]">
                {u.externalUrl ? (
                  <a href={u.externalUrl} target="_blank" rel="noopener noreferrer" className="block hover:opacity-90">
                    {inner}
                  </a>
                ) : (
                  inner
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------- CTA ------------------------------- */
export function CtaSection({ home }: SectionProps) {
  return <CtaBand title={home.cta.title} body={home.cta.body} />;
}

export function CtaBand({ title, body }: { title: string; body: string }) {
  const { whatsapp, primaryPhone } = useContactLinks();
  // A gold panel on white, so it reads as its own block and not as the top of the navy footer.
  return (
    <section className="bg-white py-16 lg:py-24">
      <div className="container-page">
        <div className="grid overflow-hidden rounded-lg bg-gold-400 lg:grid-cols-[1.35fr_1fr]">
          <div className="px-7 py-12 sm:px-12 lg:py-16">
            <h2 className="max-w-xl text-3xl leading-[1.08] font-extrabold tracking-[-0.02em] text-navy-950 sm:text-[2.6rem]">{title}</h2>
            <p className="mt-4 max-w-lg text-lg text-navy-900/80">{body}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/contact#quote" variant="navy" size="lg">
                Get a free quote <ArrowRight className="size-4.5" aria-hidden />
              </ButtonLink>
              {whatsapp ? (
                <ButtonLink href={whatsapp} variant="outline" size="lg" className="border-navy-950/25 text-navy-950 hover:border-navy-950 hover:bg-navy-950/5">
                  <MessageCircle className="size-5" aria-hidden /> WhatsApp
                </ButtonLink>
              ) : primaryPhone ? (
                <ButtonLink href={primaryPhone.href} variant="outline" size="lg" className="border-navy-950/25 text-navy-950 hover:border-navy-950 hover:bg-navy-950/5">
                  <Phone className="size-5" aria-hidden /> Call us
                </ButtonLink>
              ) : null}
            </div>
            {/* The hero's route line, closing the page where it opened. */}
            <div aria-hidden className="relative mt-12 h-0.5 max-w-md bg-navy-950">
              <span className="absolute top-1/2 -right-0.5 size-3 -translate-y-1/2 rotate-45 border-t-2 border-r-2 border-navy-950" />
            </div>
          </div>
          <SmartImage src={IMAGES.containerShip} alt="" sizes="(min-width: 1024px) 40vw, 1px" className="hidden min-h-full lg:block" />
        </div>
      </div>
    </section>
  );
}
