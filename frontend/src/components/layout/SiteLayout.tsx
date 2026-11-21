import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { useContactLinks } from "@/hooks/useContactLinks";
import { Footer } from "./Footer";
import { Header } from "./Header";

function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      // Wait a frame so the target section has rendered.
      requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" }));
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);
  return null;
}

function WhatsAppButton() {
  const { whatsapp } = useContactLinks();
  if (!whatsapp) return null;
  return (
    <a
      href={whatsapp}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="group fixed right-4 bottom-4 z-40 flex items-center gap-2 rounded-full bg-[#25D366] p-3 text-white shadow-lg shadow-black/20 transition-transform hover:scale-105 sm:right-6 sm:bottom-6"
    >
      <WhatsAppIcon className="size-8" />
      <span className="hidden pr-1 text-sm font-semibold sm:group-hover:inline">WhatsApp</span>
      {/* Red "online" dot: a soft ping ring behind a solid dot. The ring stops for reduced-motion users. */}
      <span aria-hidden className="absolute -top-0.5 -right-0.5 flex size-4">
        <span className="absolute inline-flex size-full rounded-full bg-signal-500 opacity-75 motion-safe:animate-ping" />
        <span className="relative inline-flex size-4 rounded-full border-2 border-white bg-signal-500" />
      </span>
    </a>
  );
}

export function SiteLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only z-[60] rounded-md bg-gold-500 px-4 py-2 font-semibold text-navy-950 focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <ScrollManager />
      <Header />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
