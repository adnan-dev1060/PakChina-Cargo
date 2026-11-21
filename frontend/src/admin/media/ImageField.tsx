import { ImagePlus, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { MediaFolder } from "../types";
import { MediaPicker } from "./MediaPicker";
import { thumb } from "./useMedia";

export function ImageField({ value, onChange, folder, invalid }: {
  value: string;
  onChange: (url: string) => void;
  folder: MediaFolder;
  invalid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [broken, setBroken] = useState<string | null>(null);

  return (
    <>
      {value ? (
        <div className={cn("flex flex-col gap-4 rounded-xl border p-3 sm:flex-row sm:items-center", invalid ? "border-signal-500" : "border-line")}>
          {broken === value ? (
            <div className="flex h-28 w-full items-center justify-center rounded-lg bg-signal-500/5 text-xs text-signal-600 sm:w-44">Image failed to load</div>
          ) : (
            <img src={thumb(value, 480)} alt="" onError={() => setBroken(value)} className="h-28 w-full rounded-lg bg-surface object-cover sm:w-44" />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-slate-500" title={value}>{value}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-navy-700 hover:bg-surface">
                <RefreshCw className="size-3.5" aria-hidden /> Replace
              </button>
              <button type="button" onClick={() => onChange("")} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-slate-600 hover:border-signal-500 hover:text-signal-600">
                <Trash2 className="size-3.5" aria-hidden /> Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed py-8 text-sm font-semibold text-navy-700 hover:bg-navy-50",
            invalid ? "border-signal-500" : "border-navy-200",
          )}
        >
          <ImagePlus className="size-7 text-navy-400" aria-hidden />
          Choose or upload an image
        </button>
      )}
      {open && <MediaPicker open={open} onClose={() => setOpen(false)} onSelect={onChange} folder={folder} />}
    </>
  );
}
