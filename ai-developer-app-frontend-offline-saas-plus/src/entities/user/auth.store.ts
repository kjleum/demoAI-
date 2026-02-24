import { create } from "zustand";

type AuthState = {
  accessToken?: string;
  user?: { id: string; email: string; role: "user" | "admin" };
  setToken: (t?: string) => void;
  setUser: (u?: AuthState["user"]) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: undefined,
  user: undefined,
  setToken: (t) => set({ accessToken: t }),
  setUser: (u) => set({ user: u }),
  logout: () => set({ accessToken: undefined, user: undefined })
}));
