import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { contentAdminApi } from "../api";
import { COLLECTIONS } from "../collections";
import { Editor } from "../Editor";
import { FullPageSpinner, LoadError } from "../ui";

type Item = Record<string, unknown> & { id?: string };

/** Strips server-managed fields so the form submits only editable data. */
function editable(item: Item) {
  const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = item;
  if (typeof rest.publishedAt === "string") rest.publishedAt = rest.publishedAt.slice(0, 10);
  return rest;
}

export default function CollectionEditPage() {
  const { collection = "", id } = useParams();
  const config = COLLECTIONS[collection];
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin", "content", collection, id],
    queryFn: () => contentAdminApi.get<Item>(collection, id!),
    enabled: !!config && !isNew,
  });

  if (!config) return <Navigate to="/admin" replace />;
  if (!isNew && isLoading) return <FullPageSpinner />;
  if (!isNew && (error || !data)) return <LoadError error={error} onRetry={() => refetch()} />;

  const initial = isNew ? config.empty() : editable(data!);
  const title = isNew ? `New ${config.singular.toLowerCase()}` : `Edit ${config.singular.toLowerCase()}`;

  return (
    <Editor
      key={id ?? "new"}
      title={title}
      description={config.description}
      backTo={`/admin/content/${collection}`}
      sections={config.sections}
      initial={initial}
      saveLabel={isNew ? `Create ${config.singular.toLowerCase()}` : "Save changes"}
      extraActions={
        !isNew && config.publicPath && data?.published ? (
          <a href={config.publicPath(data)} target="_blank" rel="noopener" className="inline-flex h-11 items-center gap-1.5 rounded-lg border border-line bg-white px-4 text-sm font-semibold text-navy-700 hover:bg-surface">
            View on site <ExternalLink className="size-3.5" aria-hidden />
          </a>
        ) : null
      }
      onSave={async (value) => {
        if (isNew) {
          const created = await contentAdminApi.create<Item>(collection, value);
          await qc.invalidateQueries({ queryKey: ["admin", "content", collection] });
          // Saved state is clean, so the unsaved-changes guard won't block this.
          setTimeout(() => navigate(`/admin/content/${collection}/${created.id}`, { replace: true }), 0);
          return editable(created);
        }
        const updated = await contentAdminApi.update<Item>(collection, id!, value);
        await qc.invalidateQueries({ queryKey: ["admin", "content", collection] });
        return editable(updated);
      }}
    />
  );
}
