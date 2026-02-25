// path: src/features/chat/ui/UploadsPanel.tsx
import React from "react";
import { useChatStore } from "@/features/chat/store/chatStore";

export function UploadsPanel(): React.ReactElement {
  const uploads = useChatStore((s) => s.uploads);
  const removeUpload = useChatStore((s) => s.removeUpload);

  if (uploads.length === 0) return <></>;

  return (
    <div className="card">
      <div style={{ fontWeight: 950 }}>Uploads</div>
      <div className="hr" />
      <div className="col">
        {uploads.map((u) => (
          <div key={u.id} className="row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
            <span className="pill">{u.file.name}</span>
            <span className={`badge ${u.status === "error" ? "err" : u.status === "done" ? "ok" : ""}`}>
              {u.status} • {u.progress}%
            </span>
            <button className="btn danger" onClick={() => removeUpload(u.id)}>
              remove
            </button>
            {u.error ? <div className="badge err">{u.error}</div> : null}
          </div>
        ))}
      </div>
      <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>
        Max 10MB • presign → PUT → complete • cancel/retry supported
      </div>
    </div>
  );
}
