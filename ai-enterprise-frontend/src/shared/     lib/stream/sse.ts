// path: src/shared/lib/stream/sse.ts
import { env } from "@/config/env";
import { useWorkspaceStore } from "@/features/workspaces/store/workspaceStore";

type SseHandlers = {
  onToken: (token: string) => void;
  onDone: () => void;
  onError: (err: Error) => void;
};

function parseSseChunk(chunk: string): Array<{ event?: string; data?: string }> {
  const events: Array<{ event?: string; data?: string }> = [];
  const blocks = chunk.split("\n\n");
  for (const block of blocks) {
    const lines = block.split("\n").map((l) => l.trimEnd());
    let event: string | undefined;
    let data = "";
    for (const line of lines) {
      if (line.startsWith("event:")) event = line.slice("event:".length).trim();
      if (line.startsWith("data:")) data += line.slice("data:".length).trim() + "\n";
    }
    if (event || data) events.push({ event, data: data ? data.trimEnd() : undefined });
  }
  return events;
}

export async function streamSSE(
  path: string,
  handlers: SseHandlers,
  signal?: AbortSignal
): Promise<void> {
  const ws = useWorkspaceStore.getState();
  const headers: Record<string, string> = {};
  if (ws.workspaceId) headers["X-Workspace-ID"] = ws.workspaceId;

  const res = await fetch(`${env.apiBase}${path}`, {
    method: "GET",
    headers,
    credentials: "include",
    signal
  });

  if (!res.ok || !res.body) {
    handlers.onError(new Error(`SSE failed: ${res.status}`));
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // process full events when we have \n\n
      while (buffer.includes("\n\n")) {
        const idx = buffer.indexOf("\n\n");
        const piece = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);

        const parsed = parseSseChunk(piece);
        for (const ev of parsed) {
          if (ev.event === "done") {
            handlers.onDone();
            return;
          }
          if (ev.data) handlers.onToken(ev.data);
        }
      }
    }
    handlers.onDone();
  } catch (e) {
    handlers.onError(e instanceof Error ? e : new Error(String(e)));
  }
}
