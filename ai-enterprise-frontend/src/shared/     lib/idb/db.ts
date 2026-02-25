// path: src/shared/lib/idb/db.ts
import { openDB, type DBSchema, type IDBPDatabase } from "idb";

export type OfflineMessage = {
  id: string;
  threadId: string;
  workspaceId: string | null;
  content: string;
  createdAt: number;
  attachments?: Array<{ name: string; size: number; type: string; url?: string }>;
};

export type PersistedChatMessage = {
  id: string;
  threadId: string;
  workspaceId: string | null;
  role: "user" | "assistant" | "system";
  content: string;
  status?: "pending" | "sent" | "error";
  createdAt: number;
};

interface AppDB extends DBSchema {
  offlineQueue: {
    key: string; // message id
    value: OfflineMessage;
    indexes: { byThread: string; byCreatedAt: number };
  };
  messages: {
    key: string; // message id
    value: PersistedChatMessage;
    indexes: { byThread: string; byCreatedAt: number };
  };
  meta: {
    key: string;
    value: { key: string; value: string };
  };
}

let dbPromise: Promise<IDBPDatabase<AppDB>> | null = null;

export function getDb(): Promise<IDBPDatabase<AppDB>> {
  if (!dbPromise) {
    dbPromise = openDB<AppDB>("ai_enterprise_frontend", 1, {
      upgrade(db) {
        const q = db.createObjectStore("offlineQueue", { keyPath: "id" });
        q.createIndex("byThread", "threadId");
        q.createIndex("byCreatedAt", "createdAt");

        const m = db.createObjectStore("messages", { keyPath: "id" });
        m.createIndex("byThread", "threadId");
        m.createIndex("byCreatedAt", "createdAt");

        db.createObjectStore("meta", { keyPath: "key" });
      }
    });
  }
  return dbPromise;
}
