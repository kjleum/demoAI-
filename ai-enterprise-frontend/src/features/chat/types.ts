// path: src/features/chat/types.ts
export type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  status?: "pending" | "sent" | "error";
  createdAt: number;
};

export type AttachmentMeta = {
  name: string;
  size: number;
  type: string;
  url?: string;
};

export type PendingUpload = {
  id: string;
  file: File;
  progress: number; // 0..100
  status: "pending" | "uploading" | "done" | "error" | "canceled";
  error?: string;
  url?: string; // fileUrl after complete
  abort?: () => void;
};

export type ThreadRef = {
  threadId: string;
  title: string;
  createdAt: number;
};
