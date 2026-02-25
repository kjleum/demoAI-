// path: src/shared/lib/idb/messageStore.ts
import { getDb, type PersistedChatMessage } from "@/shared/lib/idb/db";

export async function persistMessage(msg: PersistedChatMessage): Promise<void> {
  const db = await getDb();
  await db.put("messages", msg);
}

export async function persistMessages(msgs: PersistedChatMessage[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction("messages", "readwrite");
  await Promise.all(msgs.map((m) => tx.store.put(m)));
  await tx.done;
}

export async function loadThreadMessages(threadId: string): Promise<PersistedChatMessage[]> {
  const db = await getDb();
  return db.getAllFromIndex("messages", "byThread", threadId);
}

export async function clearThreadMessages(threadId: string): Promise<void> {
  const db = await getDb();
  const ids = await db.getAllKeysFromIndex("messages", "byThread", threadId);
  const tx = db.transaction("messages", "readwrite");
  await Promise.all(ids.map((k) => tx.store.delete(String(k))));
  await tx.done;
}
