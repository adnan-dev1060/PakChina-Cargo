import "@fontsource-variable/inter";
import "@fontsource-variable/archivo/wdth.css";
import "@fontsource/noto-nastaliq-urdu/400.css";
import "./index.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "motion/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./App";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

// The server puts each page's title and preview tags into the HTML for search engines and link
// previews. The app renders its own from here on, so remove the server copies to avoid duplicates.
document.querySelectorAll("[data-server-seo]").forEach((el) => el.remove());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
        <RouterProvider router={router} />
      </MotionConfig>
    </QueryClientProvider>
  </StrictMode>,
);
