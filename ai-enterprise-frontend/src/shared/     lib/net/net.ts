// path: src/shared/lib/net/net.ts
import { logger } from "@/shared/lib/logger/logger";

type Listener = (online: boolean) => void;

const listeners = new Set<Listener>();

export function isOnline(): boolean {
  return navigator.onLine;
}

export function onOnlineChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function initOnlineListener(): void {
  window.addEventListener("online", () => {
    logger.info("net.online");
    listeners.forEach((l) => l(true));
  });
  window.addEventListener("offline", () => {
    logger.warn("net.offline");
    listeners.forEach((l) => l(false));
  });
}
