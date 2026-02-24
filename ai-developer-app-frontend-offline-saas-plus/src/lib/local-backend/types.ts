export type Role = "user" | "admin";

export type User = { id: string; email: string; passwordHash: string; role: Role; createdAt: number };

export type Session = { id: string; userId: string; accessToken: string; createdAt: number; expiresAt: number };

export type Workspace = { id: string; name: string; createdAt: number };

export type Project = { id: string; workspaceId: string; name: string; tags: string[]; createdAt: number; updatedAt: number };

export type Thread = { id: string; projectId: string; title: string; tags: string[]; createdAt: number; updatedAt: number };

export type Message = { id: string; threadId: string; role: "system" | "user" | "assistant"; content: string; ts: number };

export type ThreadVersion = { id: string; threadId: string; title: string; createdAt: number; messages: Message[] };

export type FileItem = { id: string; projectId: string; name: string; type: string; size: number; createdAt: number; blob: Blob };

export type ApiKey = { id: string; name: string; prefix: string; value?: string; createdAt: number };

export type Usage = { id: "current"; window: string; tokens: number; requests: number; storageBytes: number; updatedAt: number };

export type Billing = {
  id: "current";
  plan: "free" | "pro" | "team";
  status: "active" | "trial" | "canceled";
  renewedAt: number;
  limits: { requestsPerDay: number; storageBytes: number };
};
