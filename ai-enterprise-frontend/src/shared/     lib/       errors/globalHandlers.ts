// path: src/shared/lib/errors/globalHandlers.ts
import { logger } from "@/shared/lib/logger/logger";

export function initGlobalErrorHandlers(): void {
  window.addEventListener("error", (e) => {
    logger.error("window.error", {
      message: e.message,
      filename: e.filename,
      lineno: e.lineno,
      colno: e.colno
    });
  });

  window.addEventListener("unhandledrejection", (e) => {
    logger.error("unhandledrejection", {
      reason: String((e as PromiseRejectionEvent).reason ?? "unknown")
    });
  });
}
