import { HashRouter, Route, Routes } from "react-router-dom";
import { Layout } from "../widgets/Layout/Layout";
import { ChatPage } from "../pages/ChatPage";
import { ProjectsPage } from "../pages/ProjectsPage";
import { FilesPage } from "../pages/FilesPage";
import { HistoryPage } from "../pages/HistoryPage";
import { SearchPage } from "../pages/SearchPage";
import { SettingsPage } from "../pages/SettingsPage";
import { ApiKeysPage } from "../pages/ApiKeysPage";
import { BillingPage } from "../pages/BillingPage";
import { UsagePage } from "../pages/UsagePage";
import { AdminPage } from "../pages/AdminPage";
import { TemplatesPage } from "../pages/TemplatesPage";
import { ToolsPage } from "../pages/ToolsPage";
import { OnboardingPage } from "../pages/OnboardingPage";
import { NotFoundPage } from "../pages/NotFoundPage";

export function AppRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<ChatPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/files" element={<FilesPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/api-keys" element={<ApiKeysPage />} />
          <Route path="/billing" element={<BillingPage />} />
          <Route path="/usage" element={<UsagePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/templates" element={<TemplatesPage />} />
          <Route path="/tools" element={<ToolsPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
