import { Compass, MapPin, Target } from "lucide-react";
import { CtaBand } from "@/components/sections/HomeSections";
import { PageHeader } from "@/components/ui/PageHeader";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Seo } from "@/components/ui/Seo";
import { SmartImage } from "@/components/ui/SmartImage";
import { ErrorState, Skeleton } from "@/components/ui/States";
import { useAbout, useHome, useOffices } from "@/hooks/useContent";
import { getIcon } from "@/lib/icons";

export default function AboutPage() {
  const { data: about, isLoading, isError, refetch } = useAbout();
  const { data: offices } = useOffices();
  const { data: home } = useHome();

  return (
    <>
      <Seo title="About Us" description={about?.intro} />
      <PageHeader
        eyebrow="About us"
        title={about?.title ?? "About Pak China Cargo"}
        imageUrl={about?.imageUrl}
        crumbs={[{ label: "About" }]}
        full
      />

      {isLoading ? (
        <div className="container-page space-y-6 py-20">
          <Skeleton className="h-40" />
          <Skeleton className="h-72" />
        </div>
      ) : isError || !about ? (
        <div className="container-page py-20">
          <ErrorState onRetry={() => refetch()} />
        </div>
      ) : (
        <>
          <section className="py-20 lg:py-28">
            <div className="container-page grid items-start gap-12 lg:grid-cols-2 lg:gap-20">
              <Reveal>
                <p className="font-display text-2xl leading-snug font-bold text-navy-900 sm:text-3xl">{about.intro}</p>
                <div className="mt-8 space-y-4 leading-relaxed text-slate-600">
                  {about.story.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                </div>
              </Reveal>
              <Reveal delay={0.1}>
                <SmartImage src={about.imageUrl} alt={about.imageAlt} sizes="(min-width: 1024px) 50vw, 100vw" className="aspect-[4/3] w-full rounded-lg" />
              </Reveal>
            </div>
          </section>

          <section className="bg-navy-950 py-20 lg:py-24">
            <div className="container-page grid gap-6 md:grid-cols-2">
              {[
                { icon: Target, label: "Our mission", text: about.mission },
                { icon: Compass, label: "Our vision", text: about.vision },
              ].map(({ icon: Icon, label, text }) => (
                <Reveal key={label} className="rounded-lg border border-white/10 p-8 sm:p-10">
                  <Icon className="size-7 text-gold-400" aria-hidden />
                  <h2 className="mt-5 text-base font-semibold text-gold-400">{label}</h2>
                  <p className="mt-3 font-display text-xl leading-snug font-semibold text-white sm:text-2xl">{text}</p>
                </Reveal>
              ))}
            </div>
          </section>

          {about.values.length > 0 && (
            <section className="py-20 lg:py-28">
              <div className="container-page">
                <SectionHeading eyebrow="What we stand for" title="Our values" align="center" />
                <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {about.values.map((v, i) => {
                    const Icon = getIcon(v.icon);
                    return (
                      <Reveal as="li" key={v.title} delay={i * 0.06} className="rounded-lg border border-line p-7">
                        <span className="flex size-12 items-center justify-center rounded-xl bg-navy-50 text-navy-700">
                          <Icon className="size-6" aria-hidden />
                        </span>
                        <h3 className="mt-5 text-lg font-bold">{v.title}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-slate-600">{v.description}</p>
                      </Reveal>
                    );
                  })}
                </ul>
              </div>
            </section>
          )}

          {offices?.length ? (
            <section className="bg-surface py-20">
              <div className="container-page">
                <SectionHeading eyebrow="Our offices" title="Find us across Pakistan" />
                <ul className="mt-10 grid gap-4 sm:grid-cols-3">
                  {offices.map((o) => (
                    <li key={o.id} className="flex items-start gap-4 rounded-lg bg-white p-6">
                      <MapPin className="mt-0.5 size-5 shrink-0 text-signal-500" aria-hidden />
                      <div>
                        <h3 className="text-lg font-bold">{o.city}</h3>
                        <p className="mt-1 text-sm text-slate-600">{o.address ?? o.label}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ) : null}
        </>
      )}

      {home && <CtaBand title={home.cta.title} body={home.cta.body} />}
    </>
  );
}
