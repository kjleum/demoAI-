// path: src/shared/lib/stream/ws.ts
import { env } from "@/config/env";

type WsHandlers = {
  onToken: (token: string) => void;
  onDone: () => void;
  onError: (err: Error) => void;
};

function deriveWsBase(): string {
  if (env.wsBase) return env.wsBase;
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}`;
}

export function streamWS(
  path: string,
  handlers: WsHandlers,
  signal?: AbortSignal
): () => void {
  const base = deriveWsBase();
  const url = `${base}${path}`;

  let closedByUser = false;
  let ws: WebSocket | null = null;
  let tries = 0;

  const connect = () => {
    if (closedByUser) return;
    tries += 1;
    ws = new WebSocket(url);
    ws.onmessage = (e) => {
      const text = typeof e.data === "string" ? e.data : "";
      // protocol: token lines, and special: "__DONE__"
      if (text === "__DONE__") handlers.onDone();
      else handlers.onToken(text);
    };
    ws.onerror = () => {
      handlers.onError(new Error("WS error"));
    };
    ws.onclose = () => {
      if (closedByUser) return;
      if (tries >= 3) {
        handlers.onError(new Error("WS reconnect limit"));
        return;
      }
      const backoff = Math.min(800 * tries, 2500);
      window.setTimeout(connect, backoff);
    };
  };

  connect();

  const abort = () => {
    closedByUser = true;
    try {
      ws?.close();
    } catch {
      // ignore
    }
  };

  if (signal) {
    if (signal.aborted) abort();
    signal.addEventListener("abort", abort, { once: true });
  }

  return abort;
}
