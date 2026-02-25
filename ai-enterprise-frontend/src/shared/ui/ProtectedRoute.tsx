// path: src/shared/ui/ProtectedRoute.tsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";

export function ProtectedRoute({ children }: { children: React.ReactNode }): React.ReactElement {
  const { mode, isReady } = useAuth();

  if (!isReady) {
    return (
      <div className="container">
        <div className="card">
          <div style={{ fontWeight: 900 }}>Загрузка…</div>
          <div className="muted">Проверяем сессию</div>
        </div>
      </div>
    );
  }

  if (mode !== "user") return <Navigate to="/login" replace />;
  return <>{children}</>;
}
