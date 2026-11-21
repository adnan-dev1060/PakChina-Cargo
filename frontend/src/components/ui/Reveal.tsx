import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Kept for call-site compatibility; content no longer animates in. */
  delay?: number;
  className?: string;
  y?: number;
  /** Render as a list item so it can sit directly inside <ul>/<ol>. */
  as?: "div" | "li";
}

/**
 * Wrapper used across the sections. Content now appears immediately: the page's one motion
 * moment is the hero's route line, and fading every section in made the site feel templated
 * (and hid content until scrolled into view).
 */
export function Reveal({ children, className, as = "div" }: Props) {
  const Comp = as;
  return <Comp className={className}>{children}</Comp>;
}
