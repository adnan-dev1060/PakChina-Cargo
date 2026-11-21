import { cn } from "@/lib/utils";

interface Props {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  tone?: "light" | "dark";
  className?: string;
  as?: "h1" | "h2";
}

export function SectionHeading({ eyebrow, title, subtitle, align = "left", tone = "light", className, as = "h2" }: Props) {
  const Heading = as;
  const dark = tone === "dark";
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && (
        <p className={cn("mb-3 text-base font-semibold", dark ? "text-gold-400" : "text-navy-500")}>{eyebrow}</p>
      )}
      <Heading
        className={cn(
          "text-3xl leading-[1.08] font-extrabold tracking-[-0.02em] text-balance sm:text-[2.6rem]",
          dark ? "text-white" : "text-navy-900",
        )}
      >
        {title}
      </Heading>
      {subtitle && (
        <p className={cn("mt-4 text-base leading-relaxed text-pretty sm:text-lg", dark ? "text-navy-100" : "text-slate-600")}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
