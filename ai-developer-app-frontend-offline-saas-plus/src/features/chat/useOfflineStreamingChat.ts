import { useRef } from "react";
import { useChatStore } from "./chat.store";
import { logger } from "../../lib/logger/logger";
import { apiClient } from "../../lib/api/client";
import { useNotifications } from "../../lib/notifications/notifications.store";

export function useOfflineStreamingChat() {
  const abortRef = useRef<AbortController | null>(null);
  const add = useChatStore((s) => s.addMessage);
  const updateLastAssistant = useChatStore((s) => s.updateLastAssistant);
  const pushNotice = useNotifications((s) => s.push);

  const stop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    pushNotice({ type: "info", title: "Generation stopped" });
  };

  const send = async (threadId: string, text: string) => {
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    // persist user message via local backend (mapped later)
    try {
      const { localApi } = await import("../../lib/local-backend/api");
      const { useAuthStore } = await import("../../entities/user/auth.store");
      const token = useAuthStore.getState().accessToken;

      const userMsg = await localApi.addMessage(token, threadId, "user", text);
      add(threadId, { id: userMsg.id, role: "user", content: userMsg.content, ts: userMsg.ts });

      // create assistant placeholder (persist first)
      const assistant = await localApi.addMessage(token, threadId, "assistant", "");
      add(threadId, { id: assistant.id, role: "assistant", content: "", ts: assistant.ts });

      const response = buildAssistant(text);
      const chars = response.split("");

      for (const ch of chars) {
        if (ctrl.signal.aborted) throw new Error("aborted");
        await new Promise((r) => setTimeout(r, 8));
        // update UI store
        updateLastAssistant(threadId, { content: prevContent(threadId) + ch });
        // persist periodically
      }

      // persist final assistant content
      const final = prevContent(threadId);
      await localApi.addMessage(token, threadId, "assistant", final); // append final as new message
      pushNotice({ type: "success", title: "Done" });
    } catch (e) {
      logger.warn("[chat] stream aborted/error", { e: String(e) });
    } finally {
      abortRef.current = null;
    }
  };

  const prevContent = (threadId: string) => {
    const msgs = useChatStore.getState().messagesByThread[threadId] || [];
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === "assistant") return msgs[i].content;
    }
    return "";
  };

  return { send, stop, isStreaming: !!abortRef.current };
}

function buildAssistant(user: string) {
  return (
    "✅ Offline-first ответ (без бэкенда).\n\n" +
    "Ты написал: " + user + "\n\n" +
    "Функции:\n" +
    "• история и поиск\n" +
    "• файлы в IndexedDB\n" +
    "• проекты/теги\n" +
    "• usage/billing (локально)\n\n" +
    "Когда появится бэкенд — заменишь local backend на remote, UI уже готов."
  );
}
