import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BadgeHelp, FileText, Home, Images, Inbox, MessageSquareQuote, Package, Route, Settings, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { statsApi } from "../api";
import { useAuth } from "../auth";
import { INQUIRY_STATUS_LABEL } from "../types";
import { AdminPageTitle, Badge, Card, FullPageSpinner, LoadError } from "../ui";

export function timeAgo(date: string) {
  const s = Math.round((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["admin", "stats"], queryFn: statsApi.get });

  if (isLoading) return <FullPageSpinner />;
  if (error || !data) return <LoadError error={error} onRetry={() => refetch()} />;

  const tiles: { label: string; value: number; to: string; icon: LucideIcon; highlight?: boolean }[] = [
    { label: "New inquiries", value: data.newInquiries, to: "/admin/inquiries?status=new", icon: Inbox, highlight: data.newInquiries > 0 },
    { label: "Reviews to approve", value: data.pendingTestimonials, to: "/admin/content/testimonials", icon: MessageSquareQuote, highlight: data.pendingTestimonials > 0 },
    { label: "Services", value: data.services, to: "/admin/content/services", icon: Package },
    { label: "Routes", value: data.routes, to: "/admin/content/routes", icon: Route },
    { label: "FAQs", value: data.faqs, to: "/admin/content/faqs", icon: BadgeHelp },
    { label: "Images", value: data.media, to: "/admin/media", icon: Images },
  ];

  const shortcuts = [
    { label: "Edit homepage", to: "/admin/home", icon: Home },
    { label: "Contact details & logo", to: "/admin/settings", icon: Settings },
    { label: "About page", to: "/admin/about", icon: FileText },
    { label: "Upload images", to: "/admin/media", icon: Images },
  ];

  return (
    <>
      <AdminPageTitle title={`Welcome back, ${user?.name.split(" ")[0] ?? ""}`} description="Here's what's happening on your website." />

      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        {tiles.map((t) => (
          <li key={t.label}>
            <Link to={t.to} className={`block rounded-xl border p-5 transition-colors ${t.highlight ? "border-gold-500 bg-gold-100/50 hover:bg-gold-100" : "border-line bg-white hover:border-navy-200"}`}>
              <t.icon className={`size-5 ${t.highlight ? "text-gold-600" : "text-navy-500"}`} aria-hidden />
              <p className="mt-3 font-display text-3xl font-extrabold text-navy-900">{t.value}</p>
              <p className="text-sm text-slate-500">{t.label}</p>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card
          title="Latest inquiries"
          className="lg:col-span-2"
          actions={<Link to="/admin/inquiries" className="inline-flex items-center gap-1 text-sm font-semibold text-navy-700 hover:text-navy-900">View all <ArrowRight className="size-3.5" aria-hidden /></Link>}
        >
          {!data.recentInquiries.length ? (
            <p className="py-6 text-center text-sm text-slate-500">No inquiries yet. Requests from the website's quote form will appear here.</p>
          ) : (
            <ul className="-my-2 divide-y divide-line">
              {data.recentInquiries.map((q) => (
                <li key={q.id}>
                  <Link to={`/admin/inquiries/${q.id}`} className="flex items-center gap-3 py-3 hover:bg-surface/50">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-navy-900">{q.name} · {q.city}</p>
                      <p className="truncate text-xs text-slate-500">{q.cargoType}</p>
                    </div>
                    <Badge tone={q.status === "new" ? "gold" : q.status === "closed" ? "slate" : "blue"}>{INQUIRY_STATUS_LABEL[q.status]}</Badge>
                    <span className="hidden w-20 text-right text-xs text-slate-400 sm:block">{timeAgo(q.createdAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Quick links">
          <ul className="-my-1 space-y-1">
            {shortcuts.map((s) => (
              <li key={s.to}>
                <Link to={s.to} className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm font-medium text-navy-800 hover:bg-surface">
                  <s.icon className="size-4.5 text-navy-500" aria-hidden /> {s.label}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
