import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { contentAdminApi } from "../api";
import { Editor } from "../Editor";
import { sectionLabel, type SingletonConfig } from "../singletons";
import { FullPageSpinner, LoadError } from "../ui";

type Value = Record<string, unknown>;

/** Editor for site settings, homepage and About (one document each). */
export default function SingletonPage({ config }: { config: SingletonConfig }) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin", "singleton", config.key],
    queryFn: () => contentAdminApi.getSingleton<Value>(config.key),
  });

  if (isLoading) return <FullPageSpinner />;
  if (error) return <LoadError error={error} onRetry={() => refetch()} />;
  if (!data) {
    return <LoadError error={new Error(`The ${config.title.toLowerCase()} hasn't been set up. Run “npm run seed” in the backend.`)} />;
  }

  // Homepage sections are titled by a readable name instead of their key.
  const sections =
    config.key === "home"
      ? config.sections.map((s) => ({
          ...s,
          fields: s.fields.map((f) => (f.type === "objectList" && f.name === "sections" ? { ...f, titleField: "__label" } : f)),
        }))
      : config.sections;

  const withLabels = (v: Value): Value =>
    config.key === "home"
      ? {
          ...v,
          sections: [...((v.sections as Value[]) ?? [])]
            .sort((a, b) => Number(a.order) - Number(b.order))
            .map((s) => ({ ...s, __label: sectionLabel(String(s.key)) })),
        }
      : v;

  const stripLabels = (v: Value): Value =>
    config.key === "home"
      ? { ...v, sections: ((v.sections as Value[]) ?? []).map(({ __label: _l, ...s }) => s) }
      : v;

  return (
    <Editor
      title={config.title}
      description={config.description}
      sections={sections}
      initial={withLabels(data)}
      extraActions={
        <a href={config.publicPath} target="_blank" rel="noopener" className="inline-flex h-11 items-center gap-1.5 rounded-lg border border-line bg-white px-4 text-sm font-semibold text-navy-700 hover:bg-surface">
          View on site <ExternalLink className="size-3.5" aria-hidden />
        </a>
      }
      onSave={async (value) => {
        const saved = await contentAdminApi.saveSingleton<Value>(config.key, stripLabels(value));
        await refetch();
        return withLabels(saved);
      }}
    />
  );
}
