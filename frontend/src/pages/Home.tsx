import type { ComponentType } from "react";
import { Hero } from "@/components/sections/Hero";
import {
  CommoditiesSection,
  CtaSection,
  FaqSection,
  IntroSection,
  ModesSection,
  ProcessSection,
  RoutesSection,
  ServicesSection,
  TestimonialsSection,
  UpdatesSection,
  WhyUsSection,
} from "@/components/sections/HomeSections";
import { Seo } from "@/components/ui/Seo";
import { BannerPlaceholder, ErrorState } from "@/components/ui/States";
import { useHome } from "@/hooks/useContent";
import { byOrder } from "@/lib/utils";
import type { HomeContent, HomeSection, HomeSectionKey } from "@/types/content";

const SECTIONS: Record<HomeSectionKey, ComponentType<{ section: HomeSection; home: HomeContent }>> = {
  intro: IntroSection,
  modes: ModesSection,
  services: ServicesSection,
  routes: RoutesSection,
  commodities: CommoditiesSection,
  process: ProcessSection,
  whyUs: WhyUsSection,
  testimonials: TestimonialsSection,
  faq: FaqSection,
  updates: UpdatesSection,
  cta: CtaSection,
};

export default function HomePage() {
  const { data: home, isLoading, isError, refetch } = useHome();

  if (isLoading) return <BannerPlaceholder tall />;
  if (isError || !home) {
    return (
      <>
        <BannerPlaceholder />
        <div className="container-page py-16">
          <ErrorState message="We couldn't load the page. Please try again." onRetry={() => refetch()} />
        </div>
      </>
    );
  }

  return (
    <>
      <Seo />
      <Hero hero={home.hero} />
      {byOrder(home.sections)
        .filter((s) => s.enabled)
        .map((section) => {
          const Section = SECTIONS[section.key];
          return Section ? <Section key={section.key} section={section} home={home} /> : null;
        })}
    </>
  );
}
