import { PropsWithChildren, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nProvider } from "../lib/i18n/i18n";
import { useSettingsStore } from "../entities/user/settings.store";
import { logger } from "../lib/logger/logger";

const qc = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 10_000, refetchOnWindowFocus: false },
    mutations: { retry: 0 }
  }
});

export function Providers({ children }: PropsWithChildren) {
  const theme = useSettingsStore((s) => s.theme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    logger.info("[theme]", { theme });
  }, [theme]);

  // Minimal SW registration (optional)
  useEffect(() => {
    const enabled = localStorage.getItem("offline:sw") === "1";
    if (!enabled) return;
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("./sw.js").catch(() => {});
    }
  }, []);

  return (
    <QueryClientProvider client={qc}>
      <I18nProvider>
        {children}
      </I18nProvider>
    </QueryClientProvider>
  );
}
