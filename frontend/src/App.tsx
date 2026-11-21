import { lazy, Suspense, type ReactNode } from "react";
import { createBrowserRouter, type RouteObject } from "react-router-dom";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { BannerPlaceholder } from "@/components/ui/States";
import HomePage from "@/pages/Home";

const AboutPage = lazy(() => import("@/pages/About"));
const ServicesPage = lazy(() => import("@/pages/Services"));
const ServiceDetailPage = lazy(() => import("@/pages/ServiceDetail"));
const RoutesPage = lazy(() => import("@/pages/RoutesPage"));
const ContactPage = lazy(() => import("@/pages/Contact"));
const NotFoundPage = lazy(() => import("@/pages/NotFound"));

function PageFallback() {
  return <BannerPlaceholder />;
}

const page = (node: ReactNode) => <Suspense fallback={<PageFallback />}>{node}</Suspense>;

/* ------------------------------ Admin (lazy) ------------------------------ */
const loadAdmin = () => import("@/admin");
const AdminRoot = lazy(() => loadAdmin().then((m) => ({ default: m.AdminRoot })));
const AdminShell = lazy(() => loadAdmin().then((m) => ({ default: m.AdminShell })));

type AdminPage = keyof Awaited<ReturnType<typeof loadAdmin>>["adminPages"];
/** One lazy component per admin page; all of them come from the same admin bundle. */
const adminCache = new Map<AdminPage, ReturnType<typeof lazy>>();
const admin = (name: AdminPage) => {
  if (!adminCache.has(name)) adminCache.set(name, lazy(() => loadAdmin().then((m) => ({ default: () => m.adminPages[name] }))));
  const Comp = adminCache.get(name)!;
  return page(<Comp />);
};

const routes: RouteObject[] = [
  {
    element: <SiteLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "about", element: page(<AboutPage />) },
      { path: "services", element: page(<ServicesPage />) },
      { path: "services/:slug", element: page(<ServiceDetailPage />) },
      { path: "routes", element: page(<RoutesPage />) },
      { path: "contact", element: page(<ContactPage />) },
      { path: "*", element: page(<NotFoundPage />) },
    ],
  },
  {
    path: "admin",
    element: page(<AdminRoot />),
    children: [
      { path: "login", element: admin("login") },
      {
        element: page(<AdminShell />),
        children: [
          { index: true, element: admin("dashboard") },
          { path: "inquiries", element: admin("inquiries") },
          { path: "inquiries/:id", element: admin("inquiry") },
          { path: "home", element: admin("home") },
          { path: "about", element: admin("about") },
          { path: "settings", element: admin("settings") },
          { path: "content/:collection", element: admin("collectionList") },
          { path: "content/:collection/new", element: admin("collectionEdit") },
          { path: "content/:collection/:id", element: admin("collectionEdit") },
          { path: "media", element: admin("media") },
          { path: "users", element: admin("users") },
          { path: "account", element: admin("account") },
          { path: "*", element: admin("fallback") },
        ],
      },
    ],
  },
];

export const router = createBrowserRouter(routes);
