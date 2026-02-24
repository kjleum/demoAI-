import { useChatStore } from "./chat.store";
import { logger } from "../../lib/logger/logger";

export async function hydrateChatFromLocal(projectId: string) {
  const { localApi } = await import("../../lib/local-backend/api");
  const { useAuthStore } = await import("../../entities/user/auth.store");
  const token = useAuthStore.getState().accessToken;

  const threads = await localApi.getThreads(token, projectId);
  const store = useChatStore.getState();

  // Replace in store
  store.setThreads(threads.map((t) => ({
    id: t.id, title: t.title, tags: t.tags, createdAt: t.createdAt, updatedAt: t.updatedAt
  })));

  const active = threads[0]?.id;
  if (active) store.setActiveThread(active);

  for (const t of threads) {
    const msgs = await localApi.getMessages(token, t.id);
    store.setMessages(t.id, msgs.map((m) => ({ id: m.id, role: m.role as any, content: m.content, ts: m.ts })));
  }
  logger.info("[chat] hydrated", { threads: threads.length });
}
