// path: src/features/auth/AuthProvider.tsx
import React, { useEffect } from "react";
import { getMe } from "@/api/auth";
import { useAuthStore } from "@/features/auth/store/authStore";
import { initOnlineListener } from "@/shared/lib/net/net";
import { logger } from "@/shared/lib/logger/logger";

export function AuthProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const setReady = useAuthStore((s) => s.setReady);
  const setMode = useAuthStore((s) => s.setMode);
  const setMe = useAuthStore((s) => s.setMe);

  useEffect(() => {
    initOnlineListener();

    let cancelled = false;

    (async () => {
      try {
        const me = await getMe();
        if (cancelled) return;
        setMe(me);
        setMode("user");
        setReady(true);
        logger.info("auth.me_ok", { id: me.id, email: me.email });
      } catch {
        if (cancelled) return;
        // Guest mode, no API calls required
        setMe(null);
        setMode("guest");
        setReady(true);
        logger.warn("auth.me_failed_guest");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [setMe, setMode, setReady]);

  return <>{children}</>;
}
