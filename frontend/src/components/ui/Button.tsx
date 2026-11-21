import type { ComponentProps, ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn, isExternal } from "@/lib/utils";

type Variant = "primary" | "navy" | "outline" | "outline-light" | "ghost";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-md font-semibold whitespace-nowrap transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60";

const variants: Record<Variant, string> = {
  primary: "bg-gold-500 text-navy-950 hover:bg-gold-400 shadow-sm shadow-gold-600/20",
  navy: "bg-navy-800 text-white hover:bg-navy-700",
  outline: "border border-navy-200 text-navy-800 hover:border-navy-800 hover:bg-navy-50",
  "outline-light": "border border-white/30 text-white hover:border-white hover:bg-white/10",
  ghost: "text-navy-800 hover:bg-navy-50",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-6 text-base",
};

interface StyleProps {
  variant?: Variant;
  size?: Size;
  className?: string;
}

export function buttonClass({ variant = "primary", size = "md", className }: StyleProps = {}) {
  return cn(base, variants[variant], sizes[size], className);
}

export function Button({ variant, size, className, ...props }: StyleProps & ComponentProps<"button">) {
  return <button className={buttonClass({ variant, size, className })} {...props} />;
}

interface ButtonLinkProps extends StyleProps {
  href: string;
  children: ReactNode;
  "aria-label"?: string;
}

/** Internal links use the router; external links (WhatsApp, tel:, mailto:) open natively. */
export function ButtonLink({ href, variant, size, className, children, ...rest }: ButtonLinkProps) {
  const cls = buttonClass({ variant, size, className });
  if (isExternal(href)) {
    const newTab = href.startsWith("http");
    return (
      <a href={href} className={cls} {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link to={href} className={cls} {...rest}>
      {children}
    </Link>
  );
}
