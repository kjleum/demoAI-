// path: src/features/auth/hooks/useAuth.ts
import { useAuthStore } from "@/features/auth/store/authStore";

export function useAuth() {
  const mode = useAuthStore((s) => s.mode);
  const me = useAuthStore((s) => s.me);
  const isReady = useAuthStore((s) => s.isReady);

  return { mode, me, isReady };
}
