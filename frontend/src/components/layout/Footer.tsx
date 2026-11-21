import { cloudinaryUrl } from "@/lib/images";
import { ArrowUpRight, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { useOffices, useServices } from "@/hooks/useContent";
import { useContactLinks } from "@/hooks/useContactLinks";
import { NAV_LINKS } from "./Header";

export function Footer() {
  const { settings, phones, whatsapp } = useContactLinks();
  const { data: services } = useServices();
  const { data: offices } = useOffices();
  const year = new Date().getFullYear();
  const name = settings?.companyName ?? "Pak China Cargo";

  return (
    <footer className="bg-navy-950 text-navy-100">
      <div className="container-page grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-12">
        <div className="lg:col-span-4">
          {settings?.logoUrl && (
            <Link to="/" className="inline-block rounded-xl bg-white p-2">
              <img src={cloudinaryUrl(settings.logoUrl, 240)} alt={name} className="h-20 w-auto" width={80} height={80} loading="lazy" />
            </Link>
          )}
          {settings?.tagline && <p className="mt-5 font-display text-base font-bold text-gold-400">{settings.tagline}</p>}
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-navy-200">{settings?.shortDescription}</p>
          {settings?.socials.length ? (
            <ul className="mt-6 flex flex-wrap gap-2">
              {settings.socials.map((s) => (
                <li key={s.url}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-sm capitalize text-navy-100 transition-colors hover:border-gold-400 hover:text-gold-400"
                  >
                    {s.platform}
                    {s.handle && <span className="normal-case text-navy-300">@{s.handle}</span>}
                    <ArrowUpRight className="size-3.5" aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <FooterCol title="Company" className="lg:col-span-2">
          {NAV_LINKS.map((l) => (
            <li key={l.href}>
              <Link to={l.href} className="inline-flex min-h-10 items-center hover:text-white">{l.label}</Link>
            </li>
          ))}
        </FooterCol>

        <FooterCol title="Services" className="lg:col-span-3">
          {services?.map((s) => (
            <li key={s.id}>
              <Link to={`/services/${s.slug}`} className="inline-flex min-h-10 items-center hover:text-white">{s.title}</Link>
            </li>
          ))}
        </FooterCol>

        <FooterCol title="Contact" className="lg:col-span-3">
          {phones.map((p) => (
            <li key={p.number}>
              <a href={p.href} className="flex min-h-10 items-center gap-2.5 hover:text-white">
                <Phone className="size-4 shrink-0 text-gold-400" aria-hidden /> {p.display}
              </a>
            </li>
          ))}
          {whatsapp && (
            <li>
              <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="flex min-h-10 items-center gap-2.5 hover:text-white">
                <MessageCircle className="size-4 shrink-0 text-gold-400" aria-hidden /> WhatsApp
              </a>
            </li>
          )}
          {settings?.email && (
            <li>
              <a href={`mailto:${settings.email}`} className="flex min-h-10 items-center gap-2.5 break-all hover:text-white">
                <Mail className="size-4 shrink-0 text-gold-400" aria-hidden /> {settings.email}
              </a>
            </li>
          )}
          {offices?.length ? (
            <li className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 size-4 shrink-0 text-gold-400" aria-hidden />
              <span>{offices.map((o) => o.city).join(" · ")}</span>
            </li>
          ) : null}
        </FooterCol>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-navy-300 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} {name}. All rights reserved.</p>
          <p>Developeded by <span className="font-medium text-gold-500">Mr.Chintu</span></p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <h2 className="mb-5 font-display text-base font-bold text-white">{title}</h2>
      <ul className="space-y-1 text-sm">{children}</ul>
    </div>
  );
}
