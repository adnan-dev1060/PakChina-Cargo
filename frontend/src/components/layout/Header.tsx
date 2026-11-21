import { cloudinaryUrl } from "@/lib/images";
import { AnimatePresence, motion } from "motion/react";
import { Menu, MessageCircle, Phone, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { ButtonLink } from "@/components/ui/Button";
import { useContactLinks } from "@/hooks/useContactLinks";
import { cn } from "@/lib/utils";

export const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Routes", href: "/routes" },
  { label: "Contact", href: "/contact" },
];

/** How far the page scrolls before the header turns solid white. */
const SOLID_AFTER_PX = 40;

export function Logo({ className }: { className?: string }) {
  const { settings } = useContactLinks();
  const name = settings?.companyName ?? "Pak China Cargo";
  return (
    <Link to="/" aria-label={`${name} — home`} className={cn("flex shrink-0 items-center gap-2.5 sm:gap-3", className)}>
      {settings?.logoUrl && (
        // The logo artwork has a white background, so it sits on a white plate on dark banners too.
        <span className="shrink-0 rounded-lg bg-white p-1 shadow-sm shadow-navy-950/10">
          <img src={cloudinaryUrl(settings.logoUrl, 200)} alt="" className="h-10 w-auto object-contain sm:h-12" width={56} height={56} />
        </span>
      )}
      {/* Company name beside the logo; takes the header's colour (white on the hero, navy once solid). */}
      <span className="font-display text-[1.05rem] leading-none font-extrabold tracking-[-0.01em] whitespace-nowrap sm:text-xl">{name}</span>
    </Link>
  );
}

/**
 * Site header. Every page opens with a dark banner, so the header starts transparent on top of it
 * (white text) and turns solid white once the visitor scrolls a little, or opens the mobile menu.
 */
export function Header() {
  const { pathname } = useLocation();
  // The menu is "open for a given page", so navigating anywhere closes it without an effect.
  const [openOn, setOpenOn] = useState<string | null>(null);
  // Forget the page as soon as we leave it. Otherwise, coming back to that page later
  // (e.g. tapping the logo to return home) would open the menu again by itself.
  if (openOn !== null && openOn !== pathname) setOpenOn(null);
  const open = openOn === pathname;
  const [scrolled, setScrolled] = useState(false);
  const { primaryPhone, whatsapp } = useContactLinks();
  const solid = scrolled || open;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SOLID_AFTER_PX);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,color] duration-300",
        solid ? "bg-white text-navy-900 shadow-[0_1px_0_var(--color-line),0_8px_24px_-12px_rgb(10_31_55/0.18)]" : "bg-transparent text-white",
      )}
    >
      {/* Keeps white text readable over bright photos while transparent. */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 -z-10 bg-linear-to-b from-navy-950/60 to-transparent transition-opacity duration-300",
          solid ? "opacity-0" : "opacity-100",
        )}
      />
      <div className="container-page flex h-20 items-center justify-between gap-6">
        <Logo />

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <NavLink
                  to={l.href}
                  end={l.href === "/"}
                  className={({ isActive }) =>
                    cn(
                      "relative block px-4 py-2 text-[0.95rem] font-semibold transition-colors",
                      solid
                        ? isActive ? "text-navy-900" : "text-slate-600 hover:text-navy-900"
                        : isActive ? "text-white" : "text-white/75 hover:text-white",
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {l.label}
                      {isActive && <motion.span layoutId="nav-underline" className="absolute inset-x-4 -bottom-0.5 h-0.5 bg-gold-500" />}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <ButtonLink href="/contact#quote" className="hidden sm:inline-flex">
            Get a quote
          </ButtonLink>
          <button
            type="button"
            onClick={() => setOpenOn(open ? null : pathname)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            className={cn(
              "inline-flex size-11 items-center justify-center rounded-lg transition-colors lg:hidden",
              solid ? "text-navy-900 hover:bg-navy-50" : "text-white hover:bg-white/10",
            )}
          >
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-nav"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-x-0 top-full h-[calc(100dvh-5rem)] overflow-y-auto border-t border-line bg-white lg:hidden"
          >
            <nav aria-label="Mobile" className="container-page py-6">
              <ul className="divide-y divide-line">
                {NAV_LINKS.map((l) => (
                  <li key={l.href}>
                    <NavLink
                      to={l.href}
                      end={l.href === "/"}
                      className={({ isActive }) =>
                        cn("flex items-center justify-between py-4 font-display text-xl font-bold", isActive ? "text-navy-900" : "text-slate-500")
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {l.label}
                          {isActive && <span aria-hidden className="size-2 bg-gold-500" />}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
              <div className="mt-8 grid gap-3">
                <ButtonLink href="/contact#quote" size="lg">Get a free quote</ButtonLink>
                {whatsapp && (
                  <ButtonLink href={whatsapp} variant="outline" size="lg">
                    <MessageCircle className="size-5" aria-hidden /> WhatsApp us
                  </ButtonLink>
                )}
                {primaryPhone && (
                  <ButtonLink href={primaryPhone.href} variant="ghost" size="lg">
                    <Phone className="size-5" aria-hidden /> {primaryPhone.label}
                  </ButtonLink>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
