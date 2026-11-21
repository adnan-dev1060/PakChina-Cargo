import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export const inputBase =
  "w-full rounded-lg border bg-white px-3.5 text-sm text-ink placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 disabled:bg-surface disabled:text-slate-500";

export function inputCls(invalid?: boolean, extra?: string) {
  return cn(
    inputBase,
    invalid ? "border-signal-500 focus:ring-signal-500/25" : "border-line focus:border-navy-500 focus:ring-navy-500/15",
    extra,
  );
}

export function FieldShell({
  id,
  label,
  help,
  error,
  required,
  className,
  children,
}: {
  id: string;
  label: string;
  help?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-navy-900">
        {label} {required && <span className="text-signal-500" aria-hidden>*</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-medium text-signal-600">{error}</p>
      ) : help ? (
        <p className="mt-1.5 text-xs text-slate-500">{help}</p>
      ) : null}
    </div>
  );
}

export function TextInput({ invalid, className, ...props }: ComponentProps<"input"> & { invalid?: boolean }) {
  return <input {...props} aria-invalid={invalid || undefined} className={inputCls(invalid, cn("h-10", className))} />;
}

export function TextArea({ invalid, className, ...props }: ComponentProps<"textarea"> & { invalid?: boolean }) {
  return <textarea {...props} aria-invalid={invalid || undefined} className={inputCls(invalid, cn("py-2.5 leading-relaxed", className))} />;
}

export function SelectInput({ invalid, className, ...props }: ComponentProps<"select"> & { invalid?: boolean }) {
  return <select {...props} aria-invalid={invalid || undefined} className={inputCls(invalid, cn("h-10", className))} />;
}

export function Toggle({ checked, onChange, label, id }: { checked: boolean; onChange: (v: boolean) => void; label: string; id?: string }) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500",
        checked ? "bg-green-600" : "bg-slate-300",
      )}
    >
      <span className={cn("inline-block size-5 rounded-full bg-white shadow transition-transform", checked ? "translate-x-5.5" : "translate-x-0.5")} />
    </button>
  );
}
