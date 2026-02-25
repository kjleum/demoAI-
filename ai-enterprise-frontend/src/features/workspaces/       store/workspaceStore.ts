// path: src/features/workspaces/store/workspaceStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type Role = "owner" | "admin" | "member";

type WorkspaceState = {
  workspaceId: string | null;
  role: Role | null;

  setWorkspace: (id: string, role: Role) => void;
  reset: () => void;
};

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      workspaceId: null,
      role: null,
      setWorkspace: (workspaceId, role) => set({ workspaceId, role }),
      reset: () => set({ workspaceId: null, role: null })
    }),
    {
      name: "ai_workspace",
      storage: createJSONStorage(() => localStorage)
    }
  )
);
