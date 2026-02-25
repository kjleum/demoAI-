// path: src/features/chat/ui/MessageList.tsx
import React, { useEffect, useRef } from "react";
import type { Message } from "@/features/chat/types";
import { MarkdownMessage } from "@/features/chat/ui/MarkdownMessage";

export function MessageList({ messages }: { messages: Message[] }): React.ReactElement {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  return (
    <div className="chatlog" ref={ref}>
      {messages.length === 0 ? (
        <div className="card">
          <div style={{ fontWeight: 950 }}>Пустой чат</div>
          <div className="muted" style={{ marginTop: 6 }}>
            Напиши сообщение. Guest режим — локально, User режим — backend + streaming.
          </div>
        </div>
      ) : null}

      {messages.map((m) => (
        <div key={m.id} className={`msg ${m.role === "user" ? "user" : "ai"}`}>
          <div className="meta">
            <span className="tag">{m.role.toUpperCase()}</span>
            <span className="tag">{new Date(m.createdAt).toLocaleString()}</span>
          </div>

          {m.role === "assistant" ? <MarkdownMessage content={m.content} /> : <div>{m.content}</div>}

          <div className="row" style={{ justifyContent: "space-between", marginTop: 8, flexWrap: "wrap" }}>
            <span className={`badge ${m.status === "error" ? "err" : m.status === "sent" ? "ok" : ""}`}>
              {m.status ?? "sent"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
