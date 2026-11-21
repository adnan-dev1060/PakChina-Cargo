/** Shared input styling and helpers for the public forms (quote request, review). */
import type { UseFormRegisterReturn } from "react-hook-form";
import { cn } from "@/lib/utils";

export function inputClass(invalid: boolean) {
  return cn(
    "h-12 w-full rounded-lg border bg-white px-4 text-[0.95rem] text-ink placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2",
    invalid ? "border-signal-500 focus:ring-signal-500/30" : "border-line focus:border-navy-500 focus:ring-navy-500/20",
  );
}

/** `idPrefix` keeps ids unique when two forms could share a page. */
export function fieldProps(reg: UseFormRegisterReturn, invalid: boolean, idPrefix = "") {
  const id = idPrefix + reg.name;
  return { ...reg, id, "aria-invalid": invalid || undefined, "aria-describedby": invalid ? `${id}-error` : undefined, className: inputClass(invalid) };
}


/** Value of the hidden spam-trap field in the submitted form (empty for real visitors). */
export function trapValue(event?: React.BaseSyntheticEvent): string | undefined {
  const form = event?.target;
  if (!(form instanceof HTMLFormElement)) return undefined;
  const value = new FormData(form).get("website");
  return typeof value === "string" && value ? value : undefined;
}
