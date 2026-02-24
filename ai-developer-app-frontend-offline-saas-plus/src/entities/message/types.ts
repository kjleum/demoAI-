export type Role = "system" | "user" | "assistant" | "tool";
export type ChatMessage = {
  id: string;
  role: Role;
  content: string;
  ts: number;
  requestId?: string;
};
export type ChatThread = {
  id: string;
  title: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
};
