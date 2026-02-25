// path: src/widgets/layout/AppLayout.tsx
import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { logoutAction } from "@/features/auth/actions/logoutAction";
import { WorkspaceSelector } from "@/widgets/workspaces/WorkspaceSelector";
import { getTelegram } from "@/shared/lib/telegram/getTelegram";

export function AppLayout({ children }: { children: React.ReactNode }): React.ReactElement {
  const { mode, me } = useAuth();
  const nav = useNavigate();
  const tg = getTelegram();

  const onLogout = async () => {
    await logoutAction();
    nav("/login");
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="card">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div>
              <div style={{ fontWeight: 950 }}>AI Platform</div>
              <div className="muted" style={{ fontSize: 12 }}>
                {tg ? "Telegram Mini App" : "Web"} • {mode.toUpperCase()}
              </div>
            </div>
            <span className="pill">{me?.email ?? "Guest"}</span>
          </div>

          {mode === "user" ? (
            <>
              <div className="hr" />
              <WorkspaceSelector />
            </>
          ) : (
            <>
              <div className="hr" />
              <div className="muted" style={{ fontSize: 12 }}>
                Guest режим: локальный чат, demo ответы, offline-first без API.
              </div>
            </>
          )}
        </div>

        <div className="hr" />

        <div className="col">
          <NavLink to="/chat" className={({ isActive }) => `btn ${isActive ? "primary" : ""}`}>
            Чат
          </NavLink>
          <NavLink to="/workspaces" className={({ isActive }) => `btn ${isActive ? "primary" : ""}`}>
            Workspaces
          </NavLink>
          <NavLink to="/login" className={({ isActive }) => `btn ${isActive ? "primary" : ""}`}>
            Login
          </NavLink>
        </div>

        <div className="hr" />

        <div className="row" style={{ justifyContent: "space-between" }}>
          <Link className="btn" to="/chat">
            Home
          </Link>
          <button className="btn danger" onClick={onLogout}>
            Logout
          </button>
        </div>
      </aside>

      <main className="main">
        <div className="container">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div className="row">
              <div style={{ fontWeight: 950, fontSize: 16 }}>Enterprise Chat</div>
              <span className="pill">{mode === "user" ? "backend sync + streaming" : "local + demo"}</span>
            </div>
            <div className="row">
              <span className="pill">cookies only</span>
              <span className="pill">offline-first</span>
              <span className="pill">CSP-ready</span>
            </div>
          </div>

          <div style={{ height: 12 }} />
          {children}

          <div style={{ height: 40 }} />
          <div className="muted" style={{ fontSize: 12 }}>
            <span className="kbd">Enter</span> отправить • <span className="kbd">Shift</span>+<span className="kbd">Enter</span>{" "}
            новая строка
          </div>
        </div>
      </main>
    </div>
  );
}
