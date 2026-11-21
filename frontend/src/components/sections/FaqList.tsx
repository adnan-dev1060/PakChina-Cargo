import { AnimatePresence, motion } from "motion/react";
import { Plus } from "lucide-react";
import { useId, useState } from "react";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { useFaqs } from "@/hooks/useContent";
import { cn } from "@/lib/utils";
import type { Faq } from "@/types/content";

export function FaqList() {
  const { data, isLoading, isError, refetch } = useFaqs();
  const [open, setOpen] = useState<string | null>(null);
  const baseId = useId();

  if (isLoading) {
    return (
      <div className="space-y-3" role="status" aria-label="Loading">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    );
  }
  if (isError) return <ErrorState onRetry={() => refetch()} />;
  if (!data?.length) return <EmptyState message="No questions have been added yet." />;

  // FAQs with the same "category" (set in the admin) are listed together under that label,
  // keeping the admin's order. With no categories it is one plain list.
  const groups: { category: string; items: Faq[] }[] = [];
  for (const f of data) {
    const category = f.category?.trim() ?? "";
    const group = groups.find((g) => g.category === category);
    if (group) group.items.push(f);
    else groups.push({ category, items: [f] });
  }

  const renderList = (items: Faq[]) => (
    <ul className="divide-y divide-line border-y border-line">
      {items.map((f) => {
        const isOpen = open === f.id;
        const panelId = `${baseId}-${f.id}`;
        return (
          <li key={f.id}>
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : f.id)}
                className="flex w-full items-center justify-between gap-6 py-5 text-left font-display text-base font-bold text-navy-900 hover:text-navy-600 sm:text-lg"
              >
                {f.question}
                <Plus
                  className={cn("size-5 shrink-0 text-navy-500 transition-transform duration-300", isOpen && "rotate-45")}
                  aria-hidden
                />
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={panelId}
                  role="region"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <p className="max-w-3xl pb-6 text-sm leading-relaxed text-slate-600 sm:text-base">{f.answer}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        );
      })}
    </ul>
  );

  if (groups.length === 1 && !groups[0].category) return renderList(groups[0].items);

  return (
    <div className="space-y-10">
      {groups.map((g) => (
        <div key={g.category || "_general"}>
          <p className="mb-2 text-sm font-semibold text-navy-500">{g.category || "General"}</p>
          {renderList(g.items)}
        </div>
      ))}
    </div>
  );
}
