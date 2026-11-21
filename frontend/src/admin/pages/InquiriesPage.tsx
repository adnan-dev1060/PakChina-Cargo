import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { inquiryAdminApi } from "../api";
import { TextInput } from "../form/inputs";
import { INQUIRY_STATUS_LABEL, type InquiryStatus } from "../types";
import { AdminPageTitle, Badge, FullPageSpinner, LoadError } from "../ui";
import { timeAgo } from "./DashboardPage";

const STATUSES = Object.keys(INQUIRY_STATUS_LABEL) as InquiryStatus[];
export const statusTone = (s: InquiryStatus) => (s === "new" ? "gold" : s === "closed" ? "slate" : s === "replied" ? "green" : "blue");
const MODE_LABEL: Record<string, string> = { sea: "Sea", air: "Air", road: "Road", "not-sure": "Not sure" };

export default function InquiriesPage() {
  const [params, setParams] = useSearchParams();
  const status = (params.get("status") as InquiryStatus | null) ?? undefined;
  const page = Number(params.get("page") ?? 1);
  const q = params.get("q") ?? "";
  const [search, setSearch] = useState(q);

  useEffect(() => {
    const t = setTimeout(() => {
      if (search === q) return;
      const next = new URLSearchParams(params);
      if (search) next.set("q", search);
      else next.delete("q");
      next.delete("page");
      setParams(next, { replace: true });
    }, 350);
    return () => clearTimeout(t);
  }, [search, q, params, setParams]);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["admin", "inquiries", status ?? "all", q, page],
    queryFn: () => inquiryAdminApi.list({ status, q: q || undefined, page }),
    placeholderData: keepPreviousData,
  });

  const setFilter = (s?: InquiryStatus) => {
    const next = new URLSearchParams(params);
    if (s) next.set("status", s);
    else next.delete("status");
    next.delete("page");
    setParams(next);
  };
  const setPage = (p: number) => {
    const next = new URLSearchParams(params);
    next.set("page", String(p));
    setParams(next);
  };

  return (
    <>
      <AdminPageTitle title="Inquiries" description="Quote and contact requests sent from the website." />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by status">
          {[undefined, ...STATUSES].map((s) => (
            <button key={s ?? "all"} type="button" role="tab" aria-selected={status === s} onClick={() => setFilter(s)}
              className={cn("rounded-full px-3.5 py-1.5 text-sm font-semibold", status === s ? "bg-navy-800 text-white" : "bg-white text-slate-600 hover:text-navy-900")}>
              {s ? INQUIRY_STATUS_LABEL[s] : "All"}
            </button>
          ))}
        </div>
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <TextInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, phone, city…" aria-label="Search inquiries" className="pl-9" />
        </div>
      </div>

      {isLoading ? (
        <FullPageSpinner />
      ) : error ? (
        <LoadError error={error} onRetry={() => refetch()} />
      ) : !data?.items.length ? (
        <p className="rounded-xl border border-line bg-white py-16 text-center text-sm text-slate-500">
          {q || status ? "No inquiries match these filters." : "No inquiries yet. Requests from the website's quote form will appear here."}
        </p>
      ) : (
        <>
          <div className={cn("overflow-hidden rounded-xl border border-line bg-white transition-opacity", isFetching && "opacity-60")}>
            <table className="w-full text-left text-sm">
              <thead className="hidden border-b border-line bg-surface text-xs font-semibold tracking-wide text-slate-500 uppercase md:table-header-group">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Shipment</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.items.map((i) => (
                  <tr key={i.id} className={cn("relative block hover:bg-surface/60 md:table-row", i.status === "new" && "bg-gold-100/30")}>
                    <td className="block px-4 pt-3 md:table-cell md:py-3">
                      <Link to={`/admin/inquiries/${i.id}`} className="font-semibold text-navy-900 after:absolute after:inset-0">{i.name}</Link>
                      <p className="text-xs text-slate-500">{i.phone} · {i.city}</p>
                    </td>
                    <td className="block px-4 md:table-cell md:py-3">
                      <p className="line-clamp-1 text-slate-700">{i.cargoType}</p>
                      <p className="text-xs text-slate-500">{MODE_LABEL[i.mode] ?? i.mode}</p>
                    </td>
                    <td className="block px-4 py-1 md:table-cell md:py-3">
                      <Badge tone={statusTone(i.status)}>{INQUIRY_STATUS_LABEL[i.status]}</Badge>
                    </td>
                    <td className="block px-4 pb-3 text-xs text-slate-500 md:table-cell md:py-3 md:text-right">{timeAgo(i.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
            <span>{data.total} total</span>
            {data.pages > 1 && (
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
                <span>Page {data.page} of {data.pages}</span>
                <Button variant="outline" size="sm" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Next</Button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
