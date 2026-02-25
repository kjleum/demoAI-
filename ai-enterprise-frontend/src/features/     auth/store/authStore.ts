// path: src/features/auth/store/authStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Me } from "@/api/auth";
import { env } from "@/config/env";

export type AuthMode = "guest" | "user";

type AuthState = {
  isReady: boolean;
  mode: AuthMode;
  me: Me | null;

  setReady: (ready: boolean) => void;
  setMode: (mode: AuthMode) => void;
  setMe: (me: Me | null) => void;
  reset: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isReady: false,
      mode: env.defaultMode === "user" ? "user" : "guest",
      me: null,

      setReady: (isReady) => set({ isReady }),
      setMode: (mode) => set({ mode }),
      setMe: (me) => set({ me }),

      reset: () =>
        set({
          isReady: true,
          mode: "guest",
          me: null
        })
    }),
    {
      name: "ai_auth_guest_persist",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        // ONLY guest mode persist is required; no tokens stored anyway
        mode: s.mode === "guest" ? "guest" : "guest"
      })
    }
  )
);
