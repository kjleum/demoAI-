import { create } from "zustand";
import { ChatMessage, ChatThread } from "../../entities/message/types";

type State = {
  threads: ChatThread[];
  activeThreadId?: string;
  messagesByThread: Record<string, ChatMessage[]>;
  setActiveThread: (id: string) => void;
  createThread: () => string;
  addMessage: (threadId: string, m: ChatMessage) => void;
  updateLastAssistant: (threadId: string, patch: Partial<ChatMessage>) => void;
  setThreadTitle: (threadId: string, title: string) => void;
  toggleThreadTag: (threadId: string, tag: string) => void;
  setThreads: (threads: ChatThread[]) => void;
  setMessages: (threadId: string, msgs: ChatMessage[]) => void;
};

export const useChatStore = create<State>((set, get) => ({
  threads: [{ id: "t1", title: "New chat", tags: [], createdAt: Date.now(), updatedAt: Date.now() }],
  activeThreadId: "t1",
  messagesByThread: {
    t1: [{ id: "m1", role: "assistant", content: "Привет! Это production-скелет платформы. Включи debug overlay: localStorage['debug:overlay']='1' и обнови страницу.", ts: Date.now() }]
  },
  setActiveThread: (id) => set({ activeThreadId: id }),
  createThread: () => {
    const id = crypto.randomUUID();
    const now = Date.now();
    set({ threads: [{ id, title: "New chat", tags: [], createdAt: now, updatedAt: now }, ...get().threads], activeThreadId: id, messagesByThread: { ...get().messagesByThread, [id]: [] } });
    return id;
  },
  addMessage: (threadId, m) => set({
    messagesByThread: { ...get().messagesByThread, [threadId]: [...(get().messagesByThread[threadId] || []), m] },
    threads: get().threads.map((t) => t.id === threadId ? { ...t, updatedAt: Date.now() } : t)
  }),
  updateLastAssistant: (threadId, patch) => set({
    messagesByThread: {
      ...get().messagesByThread,
      [threadId]: (get().messagesByThread[threadId] || []).map((x, idx, arr) => {
        const lastIdx = [...arr].reverse().findIndex((m) => m.role === "assistant");
        const realIdx = lastIdx === -1 ? -1 : arr.length - 1 - lastIdx;
        if (idx !== realIdx) return x;
        return { ...x, ...patch };
      })
    }
  }),
  setThreadTitle: (threadId, title) => set({ threads: get().threads.map((t) => t.id === threadId ? { ...t, title } : t) }),
  toggleThreadTag: (threadId, tag) => set({ threads: get().threads.map((t) => t.id !== threadId ? t : ({ ...t, tags: t.tags.includes(tag) ? t.tags.filter((x) => x !== tag) : [...t.tags, tag] })) })
}));
