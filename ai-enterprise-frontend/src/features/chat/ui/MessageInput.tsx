// path: src/features/chat/ui/MessageInput.tsx
import React, { useMemo, useState } from "react";
import type { AttachmentMeta } from "@/features/chat/types";
import { useChatStore } from "@/features/chat/store/chatStore";

export function MessageInput(): React.ReactElement {
  const sendMessage = useChatStore((s) => s.sendMessage);
  const addFiles = useChatStore((s) => s.addFiles);
  const uploads = useChatStore((s) => s.uploads);

  const [text, setText] = useState("");

  const readyAttachments: AttachmentMeta[] = useMemo(() => {
    return uploads
      .filter((u) => u.status === "done" && !!u.url)
      .map((u) => ({
        name: u.file.name,
        size: u.file.size,
        type: u.file.type || "application/octet-stream",
        url: u.url
      }));
  }, [uploads]);

  const hasUploading = uploads.some((u) => u.status === "uploading" || u.status === "pending");

  const onSend = async () => {
    const trimmed = text.trim();
    if (!trimmed && readyAttachments.length === 0) return;
    setText("");
    await sendMessage(trimmed || "(attachments)", readyAttachments);
  };

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
        <span className="pill">uploads: {uploads.length}</span>
        <span className="pill">{hasUploading ? "uploading…" : "ready"}</span>
      </div>

      <div className="hr" />

      <textarea
        className="input"
        rows={3}
        placeholder="Сообщение…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            void onSend();
          }
        }}
      />

      <div className="hr" />

      <div className="row" style={{ flexWrap: "wrap" }}>
        <label className="btn" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          📎 Upload
          <input
            type="file"
            multiple
            style={{ display: "none" }}
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              addFiles(files);
              e.currentTarget.value = "";
            }}
            accept="image/*,video/*,application/pdf,text/plain,text/csv"
          />
        </label>

        <button className="btn primary" onClick={() => void onSend()} disabled={hasUploading}>
          Send
        </button>
      </div>

      {readyAttachments.length ? (
        <>
          <div className="hr" />
          <div className="muted" style={{ fontSize: 12 }}>
            Ready attachments:
          </div>
          <div className="col">
            {readyAttachments.map((a) => (
              <div key={`${a.name}-${a.size}`} className="row" style={{ justifyContent: "space-between" }}>
                <span className="pill">{a.name}</span>
                <span className="pill">{Math.round(a.size / 1024)} KB</span>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
