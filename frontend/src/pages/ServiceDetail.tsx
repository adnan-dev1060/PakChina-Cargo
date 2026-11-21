import { ArrowRight, Check, MessageCircle, Phone } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { ButtonLink } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Seo } from "@/components/ui/Seo";
import { SmartImage } from "@/components/ui/SmartImage";
import { BannerPlaceholder, ErrorState, Skeleton } from "@/components/ui/States";
import { useContactLinks } from "@/hooks/useContactLinks";
import { useService, useServices } from "@/hooks/useContent";
import { getIcon } from "@/lib/icons";
import NotFoundPage from "./NotFound";

export default function ServiceDetailPage() {
  const { slug = "" } = useParams();
  const { data: service, isLoading, isError, refetch } = useService(slug);
  const { data: all } = useServices();
  const { whatsappWith, primaryPhone } = useContactLinks();

  if (isLoading) {
    return (
      <>
        <BannerPlaceholder />
        <div className="container-page py-16">
          <Skeleton className="h-96" />
        </div>
      </>
    );
  }
  if (isError) {
    return (
      <>
        <BannerPlaceholder />
        <div className="container-page py-16">
          <ErrorState onRetry={() => refetch()} />
        </div>
      </>
    );
  }
  if (!service) return <NotFoundPage />;

  const others = (all ?? []).filter((s) => s.id !== service.id);
  const whatsapp = whatsappWith(`Assalam o Alaikum, I'd like to know more about your ${service.title} service.`);

  return (
    <>
      <Seo title={service.title} description={service.summary} image={service.imageUrl} />
      <PageHeader
        eyebrow="Service"
        title={service.title}
        subtitle={service.summary}
        imageUrl={service.imageUrl}
        crumbs={[{ label: "Services", href: "/services" }, { label: service.title }]}
      />

      <section className="py-16 lg:py-24">
        <div className="container-page grid gap-12 lg:grid-cols-3">
          <article className="lg:col-span-2">
            <SmartImage src={service.imageUrl} alt={service.title} priority sizes="(min-width: 1024px) 66vw, 100vw" className="aspect-[16/9] w-full rounded-lg" />
            <div className="mt-10 space-y-5 text-lg leading-relaxed text-slate-700">
              {service.description.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
            {service.features.length > 0 && (
              <>
                <h2 className="mt-12 text-2xl font-extrabold">What's included</h2>
                <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                  {service.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 rounded-xl border border-line p-4 text-sm font-medium text-navy-900">
                      <Check className="mt-0.5 size-4 shrink-0 text-gold-600" aria-hidden /> {f}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </article>

          <aside className="space-y-6 lg:sticky lg:top-32 lg:self-start">
            <div className="rounded-lg bg-navy-950 p-7 text-white">
              <h2 className="text-xl font-bold text-white">Get a quote for {service.title.toLowerCase()}</h2>
              <p className="mt-2 text-sm text-navy-200">Share your cargo details and we'll reply with options and rates.</p>
              <div className="mt-6 grid gap-3">
                <ButtonLink href="/contact#quote">
                  Request a quote <ArrowRight className="size-4" aria-hidden />
                </ButtonLink>
                {whatsapp && (
                  <ButtonLink href={whatsapp} variant="outline-light">
                    <MessageCircle className="size-4.5" aria-hidden /> Ask on WhatsApp
                  </ButtonLink>
                )}
                {primaryPhone && (
                  <a href={primaryPhone.href} className="mt-1 inline-flex min-h-11 items-center justify-center gap-2 text-sm text-navy-100 hover:text-white">
                    <Phone className="size-4" aria-hidden /> {primaryPhone.label}
                  </a>
                )}
              </div>
            </div>

            {others.length > 0 && (
              <nav aria-label="Other services" className="rounded-lg border border-line p-6">
                <h2 className="text-base font-bold text-navy-900">Other services</h2>
                <ul className="mt-4 space-y-1">
                  {others.map((o) => {
                    const Icon = getIcon(o.icon);
                    return (
                      <li key={o.id}>
                        <Link
                          to={`/services/${o.slug}`}
                          className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm font-semibold text-navy-900 hover:bg-navy-50"
                        >
                          <Icon className="size-4.5 text-navy-500" aria-hidden /> {o.title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            )}
          </aside>
        </div>
      </section>
    </>
  );
}
