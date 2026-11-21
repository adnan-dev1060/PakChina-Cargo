import {
  BadgeHelp,
  Building2,
  ExternalLink,
  FileText,
  Home,
  Images,
  Inbox,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  MessageSquareQuote,
  Newspaper,
  Package,
  Route,
  Settings,
  Ship,
  Sparkles,
  UserCog,
  Users,
  Workflow,
  X,
  type LucideIcon,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useSettings } from "@/hooks/useContent";
import { cn } from "@/lib/utils";
import { statsApi } from "./api";
import { useAuth } from "./auth";

interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  end?: boolean;
  badge?: "inquiries" | "reviews";
  role?: "super_admin";
}

const NAV: { heading?: string; items: NavItem[] }[] = [
  {
    items: [
      { label: "Dashboard", to: "/admin", icon: LayoutDashboard, end: true },
      { label: "Inquiries", to: "/admin/inquiries", icon: Inbox, badge: "inquiries" },
    ],
  },
  {
    heading: "Pages",
    items: [
      { label: "Homepage", to: "/admin/home", icon: Home },
      { label: "About page", to: "/admin/about", icon: FileText },
      { label: "Site settings", to: "/admin/settings", icon: Settings },
    ],
  },
  {
    heading: "Content",
    items: [
      { label: "Services", to: "/admin/content/services", icon: Package },
      { label: "Shipping modes", to: "/admin/content/shipping-modes", icon: Ship },
      { label: "Routes", to: "/admin/content/routes", icon: Route },
      { label: "Offices", to: "/admin/content/offices", icon: Building2 },
      { label: "What we ship", to: "/admin/content/commodities", icon: ListChecks },
      { label: "How it works", to: "/admin/content/process-steps", icon: Workflow },
      { label: "Why choose us", to: "/admin/content/highlights", icon: Sparkles },
      { label: "Testimonials", to: "/admin/content/testimonials", icon: MessageSquareQuote, badge: "reviews" },
      { label: "FAQs", to: "/admin/content/faqs", icon: BadgeHelp },
      { label: "Updates", to: "/admin/content/updates", icon: Newspaper },
    ],
  },
  {
    heading: "Library",
    items: [{ label: "Media", to: "/admin/media", icon: Images }],
  },
  {
    heading: "Account",
    items: [
      { label: "Admin users", to: "/admin/users", icon: Users, role: "super_admin" },
      { label: "My account", to: "/admin/account", icon: UserCog },
    ],
  },
];

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth();
  const { data: stats } = useQuery({ queryKey: ["admin", "stats"], queryFn: statsApi.get, staleTime: 60_000 });
  const companyName = useSettings().data?.companyName ?? "Pak China Cargo";

  return (
    <nav aria-label="Admin" className="flex h-full flex-col">
      <Link to="/admin" onClick={onNavigate} className="flex items-center gap-3 px-5 py-5">
        <img src="/brand/logo.jpg" alt="" className="size-10 rounded-lg bg-white object-contain p-0.5" />
        <div>
          <p className="font-display text-sm font-extrabold text-white">{companyName}</p>
          <p className="text-xs text-navy-300">Admin dashboard</p>
        </div>
      </Link>
      <div className="flex-1 space-y-6 overflow-y-auto px-3 pb-6">
        {NAV.map((group, gi) => {
          const items = group.items.filter((i) => !i.role || i.role === user?.role);
          if (!items.length) return null;
          return (
            <div key={gi}>
              {group.heading && <p className="mb-1.5 px-3 text-[0.7rem] font-bold tracking-widest text-navy-400 uppercase">{group.heading}</p>}
              <ul className="space-y-0.5">
                {items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          isActive ? "bg-white/10 text-white" : "text-navy-200 hover:bg-white/5 hover:text-white",
                        )
                      }
                    >
                      <item.icon className="size-4.5 shrink-0" aria-hidden />
                      <span className="flex-1">{item.label}</span>
                      {item.badge === "inquiries" && stats?.newInquiries ? (
                        <span className="rounded-full bg-gold-500 px-2 py-0.5 text-xs font-bold text-navy-950">{stats.newInquiries}</span>
                      ) : null}
                      {item.badge === "reviews" && stats?.pendingTestimonials ? (
                        <span className="rounded-full bg-gold-500 px-2 py-0.5 text-xs font-bold text-navy-950" title="Reviews waiting for approval">{stats.pendingTestimonials}</span>
                      ) : null}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </nav>
  );
}

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const companyName = useSettings().data?.companyName ?? "Pak China Cargo";
  const [menuOn, setMenuOn] = useState<string | null>(null);
  const { pathname } = useLocation();
  const menuOpen = menuOn === pathname;

  return (
    <div className="min-h-dvh bg-surface">
      <meta name="robots" content="noindex, nofollow" />
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 bg-navy-950 lg:block">
        <Sidebar />
      </aside>

      {/* Mobile sidebar */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-navy-950/60" onClick={() => setMenuOn(null)} aria-hidden />
          <aside className="absolute inset-y-0 left-0 w-72 bg-navy-950 shadow-xl">
            <button
              type="button"
              onClick={() => setMenuOn(null)}
              aria-label="Close menu"
              className="absolute top-5 right-3 rounded-md p-1.5 text-navy-200 hover:bg-white/10"
            >
              <X className="size-5" />
            </button>
            <Sidebar onNavigate={() => setMenuOn(null)} />
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-line bg-white/95 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setMenuOn(pathname)}
            aria-label="Open menu"
            className="rounded-md p-2 text-navy-900 hover:bg-surface lg:hidden"
          >
            <Menu className="size-5" />
          </button>
          {/* On phones and tablets the sidebar is hidden, so the bar shows the logo and company name. */}
          <Link to="/admin" className="flex min-w-0 items-center gap-2 lg:hidden">
            <img src="/brand/logo.jpg" alt="" className="size-8 shrink-0 rounded-md bg-white object-contain" />
            <span className="truncate font-display text-[0.95rem] font-extrabold text-navy-900">{companyName}</span>
          </Link>
          <div className="flex flex-1 items-center justify-end gap-1 sm:gap-4">
            <a
              href="/"
              target="_blank"
              rel="noopener"
              aria-label="View website"
              className="inline-flex items-center gap-1.5 rounded-lg p-2.5 text-sm font-medium text-navy-700 hover:bg-surface sm:px-3 sm:py-2"
            >
              <span className="hidden sm:inline">View website</span> <ExternalLink className="size-4 sm:size-3.5" aria-hidden />
            </a>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-navy-900">{user?.name}</p>
              <p className="text-xs text-slate-500">{user?.role === "super_admin" ? "Super admin" : "Editor"}</p>
            </div>
            <button
              type="button"
              onClick={() => void logout().then(() => navigate("/admin/login", { replace: true }))}
              aria-label="Sign out"
              className="inline-flex items-center gap-1.5 rounded-lg border border-line p-2.5 text-sm font-medium text-slate-600 hover:border-navy-200 hover:text-navy-900 sm:px-3 sm:py-2"
            >
              <LogOut className="size-4" aria-hidden /> <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
