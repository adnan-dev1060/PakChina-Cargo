import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Reorder, useDragControls } from "motion/react";
import { Check, ExternalLink, GripVertical, Pencil, Plus, Star, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { buttonClass } from "@/components/ui/Button";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { cn } from "@/lib/utils";
import { contentAdminApi } from "../api";
import { COLLECTIONS, type CollectionConfig } from "../collections";
import { Toggle } from "../form/inputs";
import { thumb } from "../media/useMedia";
import { AdminPageTitle, Badge, FullPageSpinner, LoadError, useConfirm, useToast } from "../ui";

type Item = Record<string, unknown> & { id: string; published: boolean; status?: "approved" | "pending" | "rejected"; source?: "admin" | "website" };

export default function CollectionListPage() {
  const { collection = "" } = useParams();
  const config = COLLECTIONS[collection];
  if (!config) return <Navigate to="/admin" replace />;
  return <CollectionList key={collection} config={config} />;
}

function CollectionList({ config }: { config: CollectionConfig }) {
  const qc = useQueryClient();
  const toast = useToast();
  const confirm = useConfirm();
  const queryKey = ["admin", "content", config.key];
  const { data, isLoading, error, refetch } = useQuery({ queryKey, queryFn: () => contentAdminApi.list<Item>(config.key) });
  // Local order while dragging; cleared once the server has the new order.
  const [draft, setDraft] = useState<Item[] | null>(null);
  const all = draft ?? data ?? [];
  // Reviewable collections: website submissions waiting for a decision are shown on their own.
  const pending = config.reviewable ? all.filter((i) => i.status === "pending") : [];
  const rejected = config.reviewable ? all.filter((i) => i.status === "rejected") : [];
  const items = config.reviewable ? all.filter((i) => i.status !== "pending" && i.status !== "rejected") : all;

  /** Public pages read through the "public" query keys; refresh them after every change. */
  const refreshSite = () => qc.invalidateQueries({ predicate: (q) => q.queryKey[0] !== "admin" });

  const saveOrder = async (next: Item[]) => {
    const before = data?.map((i) => i.id).join();
    if (next.map((i) => i.id).join() === before) return;
    try {
      await contentAdminApi.reorder(config.key, next.map((i) => i.id));
      await qc.invalidateQueries({ queryKey });
      setDraft(null);
      void refreshSite();
      toast.success("Order saved");
    } catch (err) {
      toast.error(err);
      setDraft(null);
    }
  };

  const togglePublish = async (item: Item) => {
    try {
      await contentAdminApi.publish(config.key, item.id, !item.published);
      await qc.invalidateQueries({ queryKey });
      void refreshSite();
      toast.success(item.published ? "Hidden from the website" : "Published");
    } catch (err) {
      toast.error(err);
      void refetch();
    }
  };

  const review = async (item: Item, decision: "approve" | "reject") => {
    try {
      await contentAdminApi.review(config.key, item.id, decision);
      await qc.invalidateQueries({ queryKey });
      await qc.invalidateQueries({ queryKey: ["admin", "stats"] });
      void refreshSite();
      toast.success(decision === "approve" ? "Approved and published" : "Rejected. It won't appear on the website");
    } catch (err) {
      toast.error(err);
    }
  };

  const remove = async (item: Item) => {
    const yes = await confirm({
      title: `Delete ${config.singular.toLowerCase()}?`,
      message: <>“{config.title(item)}” will be permanently deleted. To hide it without deleting, switch off “Published” instead.</>,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!yes) return;
    try {
      await contentAdminApi.remove(config.key, item.id);
      await qc.invalidateQueries({ queryKey });
      void refreshSite();
      toast.success("Deleted");
    } catch (err) {
      toast.error(err);
    }
  };

  const orderable = config.orderable !== false && items.length > 1;

  return (
    <>
      <AdminPageTitle
        title={config.label}
        description={config.description}
        actions={
          <Link to={`/admin/content/${config.key}/new`} className={buttonClass()}>
            <Plus className="size-4" aria-hidden /> Add {config.singular.toLowerCase()}
          </Link>
        }
      />

      {isLoading ? (
        <FullPageSpinner />
      ) : error ? (
        <LoadError error={error} onRetry={() => refetch()} />
      ) : !all.length ? (
        <div className="rounded-xl border border-dashed border-line bg-white px-6 py-16 text-center">
          <p className="text-sm text-slate-500">Nothing here yet.</p>
          <Link to={`/admin/content/${config.key}/new`} className={buttonClass({ variant: "navy", className: "mt-4" })}>
            <Plus className="size-4" aria-hidden /> Add the first {config.singular.toLowerCase()}
          </Link>
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-navy-900">
                Waiting for your review <Badge tone="gold">{pending.length}</Badge>
              </h2>
              <ul className="space-y-3">
                {pending.map((item) => (
                  <ReviewCard key={item.id} item={item} onApprove={() => void review(item, "approve")} onReject={() => void review(item, "reject")} onDelete={() => void remove(item)} />
                ))}
              </ul>
            </section>
          )}
          {config.reviewable && pending.length > 0 && items.length > 0 && <h2 className="mb-3 text-sm font-bold text-navy-900">Approved</h2>}
          {orderable && <p className="mb-3 text-xs text-slate-500">Drag the handle to change the order on the website.</p>}
          <Reorder.Group as="ul" axis="y" values={items} onReorder={setDraft} className="space-y-2">
            {items.map((item) => (
              <Row
                key={item.id}
                item={item}
                config={config}
                orderable={orderable}
                onDrop={() => void saveOrder(items)}
                onToggle={() => void togglePublish(item)}
                onDelete={() => void remove(item)}
              />
            ))}
          </Reorder.Group>
          {rejected.length > 0 && (
            <details className="mt-8 rounded-xl border border-line bg-white">
              <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-slate-600">Rejected ({rejected.length})</summary>
              <ul className="space-y-3 border-t border-line p-3">
                {rejected.map((item) => (
                  <ReviewCard key={item.id} item={item} onApprove={() => void review(item, "approve")} onDelete={() => void remove(item)} />
                ))}
              </ul>
            </details>
          )}
        </>
      )}
    </>
  );
}

function Row({ item, config, orderable, onDrop, onToggle, onDelete }: {
  item: Item;
  config: CollectionConfig;
  orderable: boolean;
  onDrop: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const controls = useDragControls();
  const image = config.image?.(item);
  const iconKey = config.icon?.(item);
  const subtitle = config.subtitle?.(item);

  return (
    <Reorder.Item
      value={item}
      as="li"
      dragListener={false}
      dragControls={controls}
      onDragEnd={onDrop}
      className="flex items-center gap-3 rounded-xl border border-line bg-white p-3 sm:gap-4"
    >
      {orderable && (
        <button
          type="button"
          onPointerDown={(e) => controls.start(e)}
          className="shrink-0 cursor-grab touch-none rounded-md p-1 text-slate-400 hover:text-navy-700 active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <GripVertical className="size-5" />
        </button>
      )}
      {image ? (
        <img src={thumb(image, 160)} alt="" className="hidden size-14 shrink-0 rounded-lg bg-surface object-cover sm:block" />
      ) : iconKey ? (
        <span className="hidden size-14 shrink-0 items-center justify-center rounded-lg bg-navy-50 text-navy-700 sm:flex">
          <DynamicIcon name={iconKey} className="size-6" />
        </span>
      ) : null}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link to={`/admin/content/${config.key}/${item.id}`} className="truncate font-semibold text-navy-900 hover:underline">
            {config.title(item) || "(untitled)"}
          </Link>
          {!item.published && <Badge>Hidden</Badge>}
          {item.source === "website" && <Badge tone="blue">From website</Badge>}
        </div>
        {subtitle && <p className="truncate text-sm text-slate-500">{subtitle}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <span className="hidden text-xs text-slate-500 md:inline">{item.published ? "Live" : "Hidden"}</span>
        <Toggle checked={item.published} onChange={onToggle} label={item.published ? "Unpublish" : "Publish"} />
        {config.publicPath && item.published && (
          <a href={config.publicPath(item)} target="_blank" rel="noopener" aria-label="View on website" className="hidden rounded-lg p-2 text-slate-500 hover:bg-surface hover:text-navy-900 sm:block">
            <ExternalLink className="size-4" />
          </a>
        )}
        <Link to={`/admin/content/${config.key}/${item.id}`} aria-label="Edit" className="rounded-lg p-2 text-slate-500 hover:bg-surface hover:text-navy-900">
          <Pencil className="size-4" />
        </Link>
        <button type="button" onClick={onDelete} aria-label="Delete" className={cn("rounded-lg p-2 text-slate-500 hover:bg-signal-500/10 hover:text-signal-600")}>
          <Trash2 className="size-4" />
        </button>
      </div>
    </Reorder.Item>
  );
}

/** A review sent from the website: the full text, so the admin can decide without opening it. */
function ReviewCard({ item, onApprove, onReject, onDelete }: { item: Item; onApprove: () => void; onReject?: () => void; onDelete: () => void }) {
  const rating = Number(item.rating ?? 0);
  const from = [item.company, item.city].filter(Boolean).join(", ");
  return (
    <li className="rounded-xl border border-gold-300 bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <p className="font-semibold text-navy-900">{String(item.name ?? "")}</p>
        {from && <p className="text-sm text-slate-500">{from}</p>}
        {rating > 0 && (
          <span className="flex gap-0.5" aria-label={`${rating} out of 5`}>
            {Array.from({ length: 5 }, (_, i) => (
              <Star key={i} className={cn("size-3.5", i < rating ? "fill-gold-500 text-gold-500" : "text-line")} aria-hidden />
            ))}
          </span>
        )}
        {typeof item.createdAt === "string" && (
          <span className="text-xs text-slate-400 sm:ml-auto">
            Sent {new Date(item.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </span>
        )}
      </div>
      <blockquote className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-slate-700">“{String(item.quote ?? "")}”</blockquote>
      {typeof item.contact === "string" && item.contact && (
        <p className="mt-2 text-xs text-slate-500">Contact (private): {item.contact}</p>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" onClick={onApprove} className={buttonClass({ size: "sm", variant: "navy" })}>
          <Check className="size-4" aria-hidden /> Approve and publish
        </button>
        {onReject && (
          <button type="button" onClick={onReject} className={buttonClass({ size: "sm", variant: "outline" })}>
            <X className="size-4" aria-hidden /> Reject
          </button>
        )}
        <button type="button" onClick={onDelete} aria-label="Delete" className="ml-auto rounded-lg p-2 text-slate-500 hover:bg-signal-500/10 hover:text-signal-600">
          <Trash2 className="size-4" />
        </button>
      </div>
    </li>
  );
}
