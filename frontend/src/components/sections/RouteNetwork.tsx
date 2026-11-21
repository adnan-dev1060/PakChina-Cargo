import { motion } from "motion/react";
import { Plane, Ship } from "lucide-react";
import { Skeleton } from "@/components/ui/States";
import { useRoutes, useShippingModes } from "@/hooks/useContent";

/**
 * Compact China → Pakistan route card, drawn from the routes in the database.
 * Destinations are stacked on the left (any city added in the admin appears automatically),
 * China sits on the right, and each destination gets an air arc; the sea lane runs underneath.
 */
const W = 480;
const ORIGIN = { x: 404, y: 132 };
const CITY_X = 120;

export function RouteNetwork() {
  const { data: routes, isLoading } = useRoutes();
  const { data: modes } = useShippingModes();

  if (isLoading) return <Skeleton className="aspect-[16/10] w-full bg-white/5" />;

  const destinations = Array.from(new Set((routes ?? []).map((r) => r.destination))).slice(0, 6);
  const top = 52;
  const bottom = 212;
  const step = destinations.length > 1 ? (bottom - top) / (destinations.length - 1) : 0;
  const points = destinations.map((name, i) => ({ name, x: CITY_X, y: destinations.length > 1 ? top + i * step : ORIGIN.y }));

  const sea = modes?.find((m) => m.mode === "sea");
  const air = modes?.find((m) => m.mode === "air");

  return (
    <figure className="rounded-lg border border-white/10 bg-navy-950 p-5 shadow-2xl shadow-navy-950/40 sm:p-6">
      <svg viewBox={`0 0 ${W} 264`} className="h-auto w-full" role="img" aria-labelledby="route-map-title">
        <title id="route-map-title">{`Shipping routes from China to ${destinations.join(", ")} by sea and air`}</title>

        {/* Sea lane: one long, low curve under the air arcs. */}
        {points.length > 0 && (
          <motion.path
            d={`M ${ORIGIN.x} ${ORIGIN.y} C ${ORIGIN.x - 20} 262, ${CITY_X + 60} 262, ${CITY_X + 10} ${bottom + 8}`}
            fill="none"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="stroke-navy-400"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.4, ease: "easeInOut" }}
          />
        )}

        {/* Air arcs to every destination. */}
        {points.map((p, i) => (
          <motion.path
            key={p.name}
            d={`M ${ORIGIN.x} ${ORIGIN.y} C ${ORIGIN.x - 110} ${p.y - 40}, ${CITY_X + 110} ${p.y - 20}, ${p.x + 8} ${p.y}`}
            fill="none"
            strokeWidth="1.25"
            strokeDasharray="4 5"
            className="stroke-gold-400/80"
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.1, delay: 0.15 + i * 0.1, ease: "easeInOut" }}
          />
        ))}

        {/* Destinations */}
        {points.map((p) => (
          <g key={p.name}>
            <circle cx={p.x} cy={p.y} r="9" className="fill-gold-400/15" />
            <circle cx={p.x} cy={p.y} r="4" className="fill-gold-400" />
            <text x={p.x - 16} y={p.y + 4.5} textAnchor="end" className="fill-white text-[13px] font-semibold">
              {p.name}
            </text>
          </g>
        ))}

        {/* Origin */}
        <circle cx={ORIGIN.x} cy={ORIGIN.y} r="16" className="fill-signal-500/15" />
        <circle cx={ORIGIN.x} cy={ORIGIN.y} r="6.5" className="fill-signal-500" />
        <text x={ORIGIN.x} y={ORIGIN.y - 26} textAnchor="middle" className="fill-white text-[13px] font-bold">
          China
        </text>
        <text x={ORIGIN.x} y={ORIGIN.y + 34} textAnchor="middle" className="fill-navy-300 text-[10.5px]">
          Guangzhou, Yiwu
        </text>
      </svg>

      <figcaption className="mt-4 grid gap-2 border-t border-white/10 pt-4 text-sm sm:grid-cols-2">
        {air && (
          <span className="flex items-center justify-between gap-3 rounded-md bg-white/5 px-3 py-2">
            <span className="inline-flex items-center gap-2 text-navy-100">
              <Plane className="size-4 text-gold-400" aria-hidden /> Air freight
            </span>
            <span className="font-wide font-bold text-white">{air.transitTime}</span>
          </span>
        )}
        {sea && (
          <span className="flex items-center justify-between gap-3 rounded-md bg-white/5 px-3 py-2">
            <span className="inline-flex items-center gap-2 text-navy-100">
              <Ship className="size-4 text-navy-300" aria-hidden /> Sea freight
            </span>
            <span className="font-wide font-bold text-white">{sea.transitTime}</span>
          </span>
        )}
      </figcaption>
    </figure>
  );
}
