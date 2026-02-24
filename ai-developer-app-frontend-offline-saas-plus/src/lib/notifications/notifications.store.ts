import { create } from "zustand";

export type Notice = { id: string; type: "info" | "success" | "error"; title: string; detail?: string; ts: number };

type State = {
  items: Notice[];
  push: (n: Omit<Notice, "id" | "ts">) => void;
  remove: (id: string) => void;
  clear: () => void;
};

export const useNotifications = create<State>((set, get) => ({
  items: [],
  push: (n) => {
    const id = crypto.randomUUID?.() ?? String(Math.random());
    const notice: Notice = { id, ts: Date.now(), ...n };
    set({ items: [notice, ...get().items].slice(0, 6) });
    // auto remove
    setTimeout(() => get().remove(id), 6000);
  },
  remove: (id) => set({ items: get().items.filter((x) => x.id !== id) }),
  clear: () => set({ items: [] })
}));
