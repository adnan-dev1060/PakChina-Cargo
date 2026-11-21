import { AlertTriangle, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-lg bg-navy-50", className)} />;
}

/**
 * Dark banner shown while a page loads. Pages open with a navy banner under the transparent
 * header, so the placeholder does too: the header stays readable and nothing jumps on load.
 */
export function BannerPlaceholder({ tall = false }: { tall?: boolean }) {
  return (
    <div aria-busy="true" aria-label="Loading" role="status" className={cn("bg-navy-950", tall ? "min-h-[640px] lg:min-h-[min(100svh,880px)]" : "min-h-80")}>
      <div className="container-page space-y-4 pt-36">
        <div className="h-10 w-2/3 max-w-xl animate-pulse rounded bg-white/10" />
        <div className="h-5 w-1/2 max-w-md animate-pulse rounded bg-white/5" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid gap-6 sm:grid-cols-2 lg:grid-cols-3", className)} role="status" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className="h-56" />
      ))}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-xl border border-line bg-surface px-6 py-10 text-center">
      <AlertTriangle className="size-6 text-signal-500" aria-hidden />
      <p className="text-sm text-slate-600">{message ?? "We couldn't load this section right now."}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-700 hover:text-navy-900"
        >
          <RotateCw className="size-4" aria-hidden /> Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return <p className="rounded-xl border border-dashed border-line px-6 py-10 text-center text-sm text-slate-500">{message}</p>;
}
