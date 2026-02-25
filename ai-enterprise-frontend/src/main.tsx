// path: src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "@/app/App";
import { ErrorBoundary } from "@/shared/ui/ErrorBoundary";
import { initGlobalErrorHandlers } from "@/shared/lib/errors/globalHandlers";
import { initTelegramApp } from "@/shared/lib/telegram/initTelegramApp";
import { logger } from "@/shared/lib/logger/logger";
import "@/shared/styles/global.css";

initGlobalErrorHandlers();
initTelegramApp();

logger.info("boot", { ua: navigator.userAgent, online: navigator.onLine });

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
