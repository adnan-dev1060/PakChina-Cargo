import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { useState } from "react";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { FaqList } from "@/components/sections/FaqList";
import { PageHeader } from "@/components/ui/PageHeader";
import { IMAGES } from "@/content/seed";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Seo } from "@/components/ui/Seo";
import { useContactLinks } from "@/hooks/useContactLinks";
import { useOffices } from "@/hooks/useContent";
import { cn } from "@/lib/utils";

export default function ContactPage() {
  const { settings, phones, whatsapp } = useContactLinks();
  const { data: offices } = useOffices();
  const [activeOffice, setActiveOffice] = useState(0);
  const office = offices?.[activeOffice];

  return (
    <>
      <Seo title="Contact Us" description="Call, WhatsApp or send us your shipment details for a quote. Offices in Lahore, Islamabad and Faisalabad." />
      <PageHeader
        eyebrow="Contact us"
        title="Let's move your cargo"
        subtitle="Call, message us on WhatsApp, or send your shipment details for a quote."
        imageUrl={IMAGES.containers}
        crumbs={[{ label: "Contact" }]}
        full
      />

      <section className="py-16 lg:py-24">
        <div className="container-page grid gap-10 lg:grid-cols-5">
          {/* Contact details */}
          <div className="space-y-4 lg:col-span-2">
            {whatsapp && (
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 rounded-lg bg-[#25D366]/10 p-6 transition-colors hover:bg-[#25D366]/15"
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#25D366] text-white">
                  <MessageCircle className="size-6" aria-hidden />
                </span>
                <span>
                  <span className="block font-display text-lg font-bold text-navy-900">Chat on WhatsApp</span>
                  <span className="text-sm text-slate-600">The quickest way to reach our team</span>
                </span>
              </a>
            )}

            <ContactCard icon={Phone} title="Call us">
              <ul className="space-y-1.5">
                {phones.map((p) => (
                  <li key={p.number}>
                    <a href={p.href} className="-my-2 inline-block py-2 font-semibold text-navy-900 hover:text-navy-600">{p.display}</a>
                    <span className="ml-2 text-xs text-slate-500">{p.label}</span>
                  </li>
                ))}
              </ul>
            </ContactCard>

            {settings?.email && (
              <ContactCard icon={Mail} title="Email">
                <a href={`mailto:${settings.email}`} className="font-semibold break-all text-navy-900 hover:text-navy-600">
                  {settings.email}
                </a>
              </ContactCard>
            )}

            {settings?.businessHours && (
              <ContactCard icon={Clock} title="Business hours">
                <p className="text-slate-700">{settings.businessHours}</p>
              </ContactCard>
            )}

            {offices?.length ? (
              <ContactCard icon={MapPin} title="Our offices">
                <ul className="space-y-1.5">
                  {offices.map((o) => (
                    <li key={o.id} className="text-slate-700">
                      <span className="font-semibold text-navy-900">{o.city}</span>
                      {o.address && <span className="block text-sm">{o.address}</span>}
                      {o.phone && <span className="block text-sm">{o.phone}</span>}
                    </li>
                  ))}
                </ul>
              </ContactCard>
            ) : null}
          </div>

          {/* Quote form */}
          <div id="quote" className="lg:col-span-3">
            <SectionHeading eyebrow="Free quote" title="Tell us about your shipment" className="mb-8" />
            <InquiryForm />
          </div>
        </div>
      </section>

      {/* Map */}
      {offices?.length ? (
        <section className="bg-surface py-16 lg:py-20">
          <div className="container-page">
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
              <SectionHeading eyebrow="Visit us" title="Find an office near you" />
              <div role="tablist" aria-label="Offices" className="flex flex-wrap gap-2">
                {offices.map((o, i) => (
                  <button
                    key={o.id}
                    type="button"
                    role="tab"
                    aria-selected={i === activeOffice}
                    onClick={() => setActiveOffice(i)}
                    className={cn(
                      "rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
                      i === activeOffice ? "bg-navy-800 text-white" : "bg-white text-navy-800 hover:bg-navy-50",
                    )}
                  >
                    {o.city}
                  </button>
                ))}
              </div>
            </div>
            {office && (
              <div className="mt-8 overflow-hidden rounded-lg border border-line bg-white">
                <iframe
                  key={office.id}
                  title={`Map of ${office.label}`}
                  src={`https://www.google.com/maps?q=${encodeURIComponent(office.mapQuery)}&output=embed`}
                  className="h-[420px] w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            )}
          </div>
        </section>
      ) : null}

      <section className="py-20">
        <div className="container-page grid gap-12 lg:grid-cols-3">
          <SectionHeading eyebrow="FAQ" title="Before you ask" />
          <div className="lg:col-span-2">
            <FaqList />
          </div>
        </div>
      </section>
    </>
  );
}

function ContactCard({ icon: Icon, title, children }: { icon: typeof Phone; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 rounded-lg border border-line p-6">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-700">
        <Icon className="size-5.5" aria-hidden />
      </span>
      <div>
        <h2 className="mb-1.5 text-sm font-semibold text-slate-500">{title}</h2>
        {children}
      </div>
    </div>
  );
}
