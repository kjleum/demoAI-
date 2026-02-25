// path: src/features/chat/store/chatStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Message, AttachmentMeta, PendingUpload, ThreadRef } from "@/features/chat/types";
import { uid } from "@/shared/lib/ids/id";
import { now } from "@/shared/lib/time/time";
import { isOnline, onOnlineChange } from "@/shared/lib/net/net";
import { enqueueOffline, dequeueOffline, listOffline } from "@/shared/lib/idb/offlineQueue";
import { clearThreadMessages, loadThreadMessages, persistMessage, persistMessages } from "@/shared/lib/idb/messageStore";
import { createThread, sendThreadMessage } from "@/api/chat";
import { streamSSE } from "@/shared/lib/stream/sse";
import { streamWS } from "@/shared/lib/stream/ws";
import { logger } from "@/shared/lib/logger/logger";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useWorkspaceStore } from "@/features/workspaces/store/workspaceStore";

type ChatState = {
  threadId: string;
  threads: ThreadRef[];
  messages: Message[];
  uploads: PendingUpload[];

  streaming: boolean;
  lastError: string | null;

  setThread: (threadId: string) => Promise<void>;
  newThread: () => Promise<void>;

  appendToken: (token: string) => void;

  sendMessage: (content: string, attachments?: AttachmentMeta[]) => Promise<void>;
  retryMessage: (id: string) => Promise<void>;
  clear: () => Promise<void>;

  addFiles: (files: File[]) => void;
  removeUpload: (id: string) => void;
  reset: () => void;

  syncOfflineQueue: () => Promise<void>;
};

function ensureAssistantPlaceholder(): Message {
  return {
    id: uid(),
    role: "assistant",
    content: "",
    status: "pending",
    createdAt: now()
  };
}

function demoAnswer(text: string): string {
  return `DEMO: получил сообщение:\n\n${text}\n\nПодключи backend для реального AI, стриминга, загрузок и воркспейсов.`;
}

async function ensureThreadId(current: string): Promise<string> {
  if (current) return current;
  const res = await createThread();
  return res.threadId;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      threadId: "",
      threads: [],
      messages: [],
      uploads: [],

      streaming: false,
      lastError: null,

      setThread: async (threadId) => {
        set({ threadId, lastError: null });
        const persisted = await loadThreadMessages(threadId);
        const msgs: Message[] = persisted
          .sort((a, b) => a.createdAt - b.createdAt)
          .map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            status: m.status,
            createdAt: m.createdAt
          }));
        set({ messages: msgs });
      },

      newThread: async () => {
        const auth = useAuthStore.getState();
        if (auth.mode === "guest") {
          const id = uid();
          const t: ThreadRef = { threadId: id, title: "Новый чат", createdAt: now() };
          set((s) => ({ threads: [t, ...s.threads], threadId: id, messages: [], lastError: null }));
          return;
        }

        const res = await createThread();
        const t: ThreadRef = { threadId: res.threadId, title: "Новый чат", createdAt: now() };
        set((s) => ({ threads: [t, ...s.threads], threadId: res.threadId, messages: [], lastError: null }));
      },

      appendToken: (token) => {
        set((s) => {
          const msgs = [...s.messages];
          const last = msgs[msgs.length - 1];
          if (!last || last.role !== "assistant") return s;
          last.content += token;
          return { messages: msgs };
        });
      },

      sendMessage: async (content, attachments) => {
        const auth = useAuthStore.getState();
        const ws = useWorkspaceStore.getState();

        const userMsg: Message = {
          id: uid(),
          role: "user",
          content,
          status: "pending",
          createdAt: now()
        };

        const aiMsg = ensureAssistantPlaceholder();

        // optimistic
        set((s) => ({
          messages: [...s.messages, userMsg, aiMsg],
          lastError: null
        }));

        // persist user msg immediately
        await persistMessage({
          id: userMsg.id,
          threadId: get().threadId || "temp",
          workspaceId: ws.workspaceId,
          role: "user",
          content: userMsg.content,
          status: userMsg.status,
          createdAt: userMsg.createdAt
        });

        // guest mode: local demo + persist
        if (auth.mode === "guest") {
          set({ streaming: true });
          const full = demoAnswer(content);
          let i = 0;
          const tick = () => {
            i = Math.min(full.length, i + Math.floor(Math.random() * 10) + 6);
            get().appendToken(full.slice(i - (Math.floor(Math.random() * 10) + 6), i));
            if (i < full.length) {
              window.setTimeout(tick, 18);
            } else {
              set((s) => {
                const msgs = [...s.messages];
                const last = msgs[msgs.length - 1];
                if (last && last.role === "assistant") last.status = "sent";
                const u = msgs[msgs.length - 2];
                if (u && u.role === "user") u.status = "sent";
                return { messages: msgs, streaming: false };
              });
            }
          };
          tick();
          return;
        }

        // user mode: if offline -> queue
        const threadId = await ensureThreadId(get().threadId);
        if (!get().threadId) {
          set({ threadId });
        }

        const payload = {
          content,
          attachments: attachments?.filter((a) => a.url).map((a) => ({
            url: a.url as string,
            name: a.name,
            type: a.type,
            size: a.size
          }))
        };

        if (!isOnline()) {
          await enqueueOffline({
            id: userMsg.id,
            threadId,
            workspaceId: ws.workspaceId,
            content,
            createdAt: userMsg.createdAt,
            attachments
          });
          set((s) => {
            const msgs = [...s.messages];
            const u = msgs.find((m) => m.id === userMsg.id);
            if (u) u.status = "pending";
            const a = msgs.find((m) => m.id === aiMsg.id);
            if (a) {
              a.status = "pending";
              a.content = "Оффлайн: сообщение поставлено в очередь. Отправим при reconnect.";
            }
            return { messages: msgs, streaming: false };
          });
          return;
        }

        // online: send + stream
        const ctrl = new AbortController();
        set({ streaming: true });

        const markFailure = async (reason: string) => {
          set((s) => {
            const msgs = [...s.messages];
            const u = msgs.find((m) => m.id === userMsg.id);
            if (u) u.status = "error";
            const a = msgs.find((m) => m.id === aiMsg.id);
            if (a) {
              a.status = "error";
              a.content = `Ошибка: ${reason}`;
            }
            return { messages: msgs, streaming: false, lastError: reason };
          });
          await persistMessages(
            get().messages.map((m) => ({
              id: m.id,
              threadId,
              workspaceId: ws.workspaceId,
              role: m.role,
              content: m.content,
              status: m.status,
              createdAt: m.createdAt
            }))
          );
        };

        try {
          await sendThreadMessage(threadId, payload);

          // mark user as sent
          set((s) => {
            const msgs = [...s.messages];
            const u = msgs.find((m) => m.id === userMsg.id);
            if (u) u.status = "sent";
            return { messages: msgs };
          });

          // streaming SSE first
          await streamSSE(
            `/chat/threads/${encodeURIComponent(threadId)}/stream`,
            {
              onToken: (t) => get().appendToken(t),
              onDone: async () => {
                set((s) => {
                  const msgs = [...s.messages];
                  const last = msgs[msgs.length - 1];
                  if (last && last.role === "assistant") last.status = "sent";
                  return { messages: msgs, streaming: false };
                });

                await persistMessages(
                  get().messages.map((m) => ({
                    id: m.id,
                    threadId,
                    workspaceId: ws.workspaceId,
                    role: m.role,
                    content: m.content,
                    status: m.status,
                    createdAt: m.createdAt
                  }))
                );
              },
              onError: async () => {
                // fallback to WS
                const stop = streamWS(
                  `/ws/chat/${encodeURIComponent(threadId)}`,
                  {
                    onToken: (t) => get().appendToken(t),
                    onDone: async () => {
                      set((s) => {
                        const msgs = [...s.messages];
                        const last = msgs[msgs.length - 1];
                        if (last && last.role === "assistant") last.status = "sent";
                        return { messages: msgs, streaming: false };
                      });
                      await persistMessages(
                        get().messages.map((m) => ({
                          id: m.id,
                          threadId,
                          workspaceId: ws.workspaceId,
                          role: m.role,
                          content: m.content,
                          status: m.status,
                          createdAt: m.createdAt
                        }))
                      );
                    },
                    onError: async (e) => {
                      stop();
                      await markFailure(e.message);
                    }
                  },
                  ctrl.signal
                );
              }
            },
            ctrl.signal
          );
        } catch (e) {
          await markFailure(e instanceof Error ? e.message : String(e));
        }
      },

      retryMessage: async (id) => {
        const msg = get().messages.find((m) => m.id === id);
        if (!msg || msg.role !== "user") return;
        await get().sendMessage(msg.content);
      },

      clear: async () => {
        const ws = useWorkspaceStore.getState();
        const threadId = get().threadId;
        set({ messages: [], lastError: null, streaming: false });
        if (threadId) await clearThreadMessages(threadId);
        // also persist clear (no-op beyond db)
        await persistMessages([]);
        // keep workspace context; do nothing else
        void ws;
      },

      addFiles: (files) => {
        const maxBytes = 10 * 1024 * 1024;
        const safe = files.filter((f) => f.size <= maxBytes);
        set((s) => ({
          uploads: [
            ...s.uploads,
            ...safe.map((file) => ({ id: uid(), file, progress: 0, status: "pending" as const }))
          ]
        }));
      },

      removeUpload: (id) => {
        set((s) => {
          const u = s.uploads.find((x) => x.id === id);
          if (u?.abort) u.abort();
          return { uploads: s.uploads.filter((x) => x.id !== id) };
        });
      },

      reset: () =>
        set({
          threadId: "",
          threads: [],
          messages: [],
          uploads: [],
          streaming: false,
          lastError: null
        }),

      syncOfflineQueue: async () => {
        const auth = useAuthStore.getState();
        if (auth.mode !== "user") return;
        if (!isOnline()) return;

        const ws = useWorkspaceStore.getState();
        const queued = await listOffline();
        if (queued.length === 0) return;

        logger.info("offline.sync_start", { count: queued.length });

        for (const item of queued) {
          try {
            await sendThreadMessage(item.threadId, {
              content: item.content,
              attachments: item.attachments?.filter((a) => a.url).map((a) => ({
                url: a.url as string,
                name: a.name,
                type: a.type,
                size: a.size
              }))
            });
            await dequeueOffline(item.id);
          } catch (e) {
            logger.warn("offline.sync_failed", { id: item.id, err: String(e) });
            break;
          }
        }
      }
    }),
    {
      name: "ai_chat_guest_persist",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        // Persist only essentials for guest UX; messages are also persisted in IndexedDB
        threadId: s.threadId,
        threads: s.threads
      })
    }
  )
);

// background sync triggers
let started = false;
export function startChatBackgroundSync(): void {
  if (started) return;
  started = true;
  onOnlineChange((online) => {
    if (!online) return;
    void useChatStore.getState().syncOfflineQueue();
  });
}
