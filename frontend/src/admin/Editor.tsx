import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { AdminApiError } from "./api";
import { FormRenderer } from "./form/FormRenderer";
import type { FormSection } from "./form/types";
import { AdminPageTitle, Spinner, useToast } from "./ui";
import { useUnsavedGuard } from "./useUnsavedGuard";

type Value = Record<string, unknown>;

/**
 * Shared editor: renders the config-driven form, tracks unsaved changes,
 * shows server validation errors next to the right fields, and refreshes the
 * public site's data after a successful save.
 */
export function Editor({
  title,
  description,
  backTo,
  sections,
  initial,
  onSave,
  extraActions,
  saveLabel = "Save changes",
}: {
  title: string;
  description?: string;
  backTo?: string;
  sections: FormSection[];
  initial: Value;
  onSave: (value: Value) => Promise<void | Value>;
  extraActions?: ReactNode;
  saveLabel?: string;
}) {
  const [value, setValue] = useState<Value>(initial);
  const [saved, setSaved] = useState<string>(() => JSON.stringify(initial));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const qc = useQueryClient();
  const dirty = JSON.stringify(value) !== saved;
  useUnsavedGuard(dirty && !saving);

  const save = async () => {
    setSaving(true);
    setErrors({});
    try {
      const result = await onSave(value);
      const next = (result as Value | undefined) ?? value;
      setValue(next);
      setSaved(JSON.stringify(next));
      void qc.invalidateQueries({ predicate: (q) => q.queryKey[0] !== "admin" || q.queryKey[1] === "stats" });
      toast.success("Saved — the website is updated");
    } catch (err) {
      if (err instanceof AdminApiError && Object.keys(err.fieldErrors).length) {
        setErrors(err.fieldErrors);
        toast.error(new Error("Please fix the highlighted fields"));
        requestAnimationFrame(() => document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus());
      } else {
        toast.error(err);
      }
    } finally {
      setSaving(false);
    }
  };

  const saveButton = (
    <Button onClick={() => void save()} disabled={saving || !dirty}>
      {saving ? <Spinner className="size-4 text-navy-950" /> : <Save className="size-4" aria-hidden />}
      {saving ? "Saving…" : saveLabel}
    </Button>
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
      noValidate
    >
      {backTo && (
        <Link to={backTo} className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-navy-900">
          <ArrowLeft className="size-4" aria-hidden /> Back
        </Link>
      )}
      <AdminPageTitle title={title} description={description} actions={<>{extraActions}{saveButton}</>} />
      <FormRenderer sections={sections} value={value} onChange={setValue} errors={errors} />
      <div className="sticky bottom-0 z-20 -mx-4 mt-6 flex items-center justify-end gap-3 border-t border-line bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <p className="mr-auto text-sm text-slate-500">{dirty ? "You have unsaved changes" : "All changes saved"}</p>
        {saveButton}
      </div>
    </form>
  );
}
