// path: src/widgets/workspaces/WorkspaceSelector.tsx
import React, { useEffect, useMemo, useState } from "react";
import { listWorkspaces, type Workspace } from "@/api/workspaces";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useWorkspaceStore } from "@/features/workspaces/store/workspaceStore";

export function WorkspaceSelector(): React.ReactElement {
  const { mode } = useAuth();
  const workspaceId = useWorkspaceStore((s) => s.workspaceId);
  const setWorkspace = useWorkspaceStore((s) => s.setWorkspace);

  const [items, setItems] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(false);

  const active = useMemo(() => items.find((w) => w.id === workspaceId) ?? null, [items, workspaceId]);

  useEffect(() => {
    if (mode !== "user") return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const ws = await listWorkspaces();
        if (cancelled) return;
        setItems(ws);
        if (!workspaceId && ws[0]) setWorkspace(ws[0].id, ws[0].role);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, setWorkspace, workspaceId]);

  if (mode !== "user") return <></>;

  return (
    <div className="col">
      <div className="muted" style={{ fontSize: 12 }}>
        Workspace
      </div>

      {loading ? (
        <div className="pill">loading…</div>
      ) : (
        <select
          className="input"
          value={workspaceId ?? ""}
          onChange={(e) => {
            const id = e.target.value;
            const w = items.find((x) => x.id === id);
            if (w) setWorkspace(w.id, w.role);
          }}
        >
          {items.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name} ({w.role})
            </option>
          ))}
        </select>
      )}

      {active ? (
        <div className="row" style={{ justifyContent: "space-between" }}>
          <span className="pill">{active.role}</span>
          <span className="pill">{active.id}</span>
        </div>
      ) : (
        <div className="muted" style={{ fontSize: 12 }}>
          Выбери workspace
        </div>
      )}
    </div>
  );
}
