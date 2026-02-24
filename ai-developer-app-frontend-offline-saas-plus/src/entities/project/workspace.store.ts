import { create } from "zustand";

export type Workspace = { id: string; name: string };
export type Project = { id: string; name: string; tags: string[] };

type State = {
  workspaces: Workspace[];
  activeWorkspaceId?: string;
  projects: Project[];
  activeProjectId?: string;
  setActiveWorkspace: (id: string) => void;
  setActiveProject: (id: string) => void;
  addProject: (name: string) => void;
  toggleTag: (projectId: string, tag: string) => void;
};

export const useWorkspaceStore = create<State>((set, get) => ({
  workspaces: [{ id: "w1", name: "Personal" }, { id: "w2", name: "Team" }],
  activeWorkspaceId: "w1",
  projects: [{ id: "p1", name: "Demo Project", tags: ["demo"] }],
  activeProjectId: "p1",
  setActiveWorkspace: (id) => set({ activeWorkspaceId: id }),
  setActiveProject: (id) => set({ activeProjectId: id }),
  addProject: (name) => set({ projects: [{ id: crypto.randomUUID(), name, tags: [] }, ...get().projects] }),
  toggleTag: (projectId, tag) => set({
    projects: get().projects.map((p) => p.id !== projectId ? p : ({
      ...p,
      tags: p.tags.includes(tag) ? p.tags.filter((t) => t !== tag) : [...p.tags, tag]
    }))
  })
}));
