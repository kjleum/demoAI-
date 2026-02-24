import { useRef } from "react";
import { logger } from "../../lib/logger/logger";
import { useChatStore } from "./chat.store";
import { ChatMessage } from "../../entities/message/types";
import { useNotifications } from "../../lib/notifications/notifications.store";

// Token streaming UI interface (SSE-ready). Works without backend using a local mock stream.
export function useStreamingChat() {
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

    const user: ChatMessage = { id: crypto.randomUUID(), role: "user", content: text, ts: Date.now() };
    add(threadId, user);

    const assistantId = crypto.randomUUID();
    add(threadId, { id: assistantId, role: "assistant", content: "", ts: Date.now() });

    // Mock token streaming (replace with SSE fetch in future)
    const tokens = (`Вот демонстрационный токен-стриминг.\n\n` +
      `• Thread: ${threadId}\n• Message: "${text}"\n\n` +
      `Подключи SSE на /chat/stream, и этот хук будет читать события 'token' и 'done'.`).split("");

    try {
      for (const ch of tokens) {
        if (ctrl.signal.aborted) throw new Error("aborted");
        await new Promise((r) => setTimeout(r, 10));
        updateLastAssistant(threadId, { content: (prevContent(threadId) + ch) });
      }
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
