// path: src/api/chat.ts
import { apiRequest } from "@/api/client";

export type CreateThreadResponse = { threadId: string };

export async function createThread(): Promise<CreateThreadResponse> {
  return apiRequest<CreateThreadResponse>("/chat/threads", { method: "POST" });
}

export async function sendThreadMessage(
  threadId: string,
  payload: { content: string; attachments?: Array<{ url: string; name: string; type: string; size: number }> }
): Promise<void> {
  await apiRequest<void>(`/chat/threads/${encodeURIComponent(threadId)}/messages`, {
    method: "POST",
    body: payload
  });
}
