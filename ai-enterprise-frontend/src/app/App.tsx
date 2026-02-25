// path: src/app/App.tsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { AppLayout } from "@/widgets/layout/AppLayout";
import { LoginPage } from "@/pages/LoginPage";
import { ChatPage } from "@/pages/ChatPage";
import { WorkspacePage } from "@/pages/WorkspacePage";
import { NotFound } from "@/pages/NotFound";
import { ProtectedRoute } from "@/shared/ui/ProtectedRoute";

export function App(): React.ReactElement {
  return (
    <AuthProvider>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/chat" replace />} />
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/workspaces"
            element={
              <ProtectedRoute>
                <WorkspacePage />
              </ProtectedRoute>
            }
          />

          {/* Guest fallback routes (explicit) */}
          <Route path="/guest/chat" element={<ChatPage />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppLayout>
    </AuthProvider>
  );
}
