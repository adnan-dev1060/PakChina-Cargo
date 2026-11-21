import { useQuery } from "@tanstack/react-query";
import { contentApi } from "@/lib/api";

const STALE = 5 * 60 * 1000;

export const useSettings = () => useQuery({ queryKey: ["settings"], queryFn: contentApi.settings, staleTime: STALE });
export const useHome = () => useQuery({ queryKey: ["home"], queryFn: contentApi.home, staleTime: STALE });
export const useAbout = () => useQuery({ queryKey: ["about"], queryFn: contentApi.about, staleTime: STALE });
export const useOffices = () => useQuery({ queryKey: ["offices"], queryFn: contentApi.offices, staleTime: STALE });
export const useShippingModes = () =>
  useQuery({ queryKey: ["shipping-modes"], queryFn: contentApi.shippingModes, staleTime: STALE });
export const useServices = () => useQuery({ queryKey: ["services"], queryFn: contentApi.services, staleTime: STALE });
export const useService = (slug: string) =>
  useQuery({ queryKey: ["service", slug], queryFn: () => contentApi.service(slug), staleTime: STALE });
export const useRoutes = () => useQuery({ queryKey: ["routes"], queryFn: contentApi.routes, staleTime: STALE });
export const useCommodities = () =>
  useQuery({ queryKey: ["commodities"], queryFn: contentApi.commodities, staleTime: STALE });
export const useProcessSteps = () =>
  useQuery({ queryKey: ["process-steps"], queryFn: contentApi.processSteps, staleTime: STALE });
export const useHighlights = () =>
  useQuery({ queryKey: ["highlights"], queryFn: contentApi.highlights, staleTime: STALE });
export const useTestimonials = () =>
  useQuery({ queryKey: ["testimonials"], queryFn: contentApi.testimonials, staleTime: STALE });
export const useFaqs = () => useQuery({ queryKey: ["faqs"], queryFn: contentApi.faqs, staleTime: STALE });
export const useUpdates = () => useQuery({ queryKey: ["updates"], queryFn: contentApi.updates, staleTime: STALE });
