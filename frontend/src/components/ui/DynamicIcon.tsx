import { createElement } from "react";
import { getIcon } from "@/lib/icons";

/** Renders an icon chosen by key in the admin (see lib/icons.ts). */
export function DynamicIcon({ name, className, strokeWidth }: { name?: string; className?: string; strokeWidth?: number }) {
  return createElement(getIcon(name), { className, strokeWidth, "aria-hidden": true });
}
