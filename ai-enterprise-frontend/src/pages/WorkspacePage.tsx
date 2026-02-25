// path: src/pages/WorkspacePage.tsx
import React from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useWorkspaceStore } from "@/features/workspaces/store/workspaceStore";

export function WorkspacePage(): React.ReactElement {
  const { mode } = useAuth();
  const ws = useWorkspaceStore((s) => ({ id: s.workspaceId, role: s.role }));

  return (
    <div className="card">
      <div style={{ fontWeight: 950 }}>Workspaces</div>
      <div className="muted" style={{ marginTop: 6 }}>
        Минимальная страница. Selector — в header/side.
      </div>
      <div className="hr" />
      <div className="row" style={{ flexWrap: "wrap" }}>
        <span className="pill">mode: {mode}</span>
        <span className="pill">workspaceId: {ws.id ?? "—"}</span>
        <span className="pill">role: {ws.role ?? "—"}</span>
      </div>
      <div className="hr" />
      <div className="muted" style={{ fontSize: 12 }}>
        Все API запросы в user mode автоматически добавляют заголовок <span className="kbd">X-Workspace-ID</span>.
      </div>
    </div>
  );
}
