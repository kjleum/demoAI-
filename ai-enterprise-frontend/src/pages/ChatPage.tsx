// path: src/pages/ChatPage.tsx
import React, { useEffect } from "react";
import { useChatStore, startChatBackgroundSync } from "@/features/chat/store/chatStore";
import { useUploads } from "@/features/uploads/hooks/useUploads";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { UploadsPanel } from "@/features/chat/ui/UploadsPanel";
import { MessageList } from "@/features/chat/ui/MessageList";
import { MessageInput } from "@/features/chat/ui/MessageInput";
import { getTelegram } from "@/shared/lib/telegram/getTelegram";

export function ChatPage(): React.ReactElement {
  const { mode } = useAuth();
  const tg = getTelegram();

  const messages = useChatStore((s) => s.messages);
  const streaming = useChatStore((s) => s.streaming);
  const lastError = useChatStore((s) => s.lastError);
  const newThread = useChatStore((s) => s.newThread);
  const clear = useChatStore((s) => s.clear);
  const syncOfflineQueue = useChatStore((s) => s.syncOfflineQueue);

  useUploads();

  useEffect(() => {
    startChatBackgroundSync();
    void syncOfflineQueue();
  }, [syncOfflineQueue]);

  useEffect(() => {
    // Telegram BackButton: go "up" by clearing chat or closing
    if (!tg) return;
    tg.BackButton.show();
    tg.BackButton.onClick(() => {
      void clear();
    });
  }, [tg, clear]);

  return (
    <div className="col">
      <div className="card">
        <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
          <div className="row" style={{ flexWrap: "wrap" }}>
            <span className="pill">mode: {mode}</span>
            <span className="pill">{streaming ? "streaming…" : "idle"}</span>
            {lastError ? <span className="badge err">error</span> : <span className="badge ok">ok</span>}
          </div>

          <div className="row" style={{ flexWrap: "wrap" }}>
            <button className="btn" onClick={() => void newThread()}>
              New thread
            </button>
            <button className="btn danger" onClick={() => void clear()}>
              Clear chat
            </button>
          </div>
        </div>

        {lastError ? (
          <>
            <div className="hr" />
            <div className="badge err">Последняя ошибка: {lastError}</div>
            <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
              SSE → fallback WS • retry logic • optimistic UI
            </div>
          </>
        ) : null}
      </div>

      <MessageList messages={messages} />

      <UploadsPanel />

      <MessageInput />
    </div>
  );
}
