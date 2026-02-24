import { PropsWithChildren, useEffect, useState } from "react";
import { useAuthStore } from "../../entities/user/auth.store";
import { LoginPage } from "../../pages/LoginPage";
import { ensureBootstrapped } from "../../lib/local-backend/bootstrap";
import { getBackendMode } from "../../config/runtime";

export function AuthGate({ children }: PropsWithChildren) {
  const token = useAuthStore((s) => s.accessToken);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      if (getBackendMode() === "local") await ensureBootstrapped();
      setReady(true);
    })();
  }, []);

  if (!ready) return <div style={{padding:16, color:"var(--muted)"}}>Bootstrapping...</div>;
  if (!token) return <LoginPage />;
  return <>{children}</>;
}
