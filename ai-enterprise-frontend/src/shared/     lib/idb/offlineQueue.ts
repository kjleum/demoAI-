// path: src/shared/lib/idb/offlineQueue.ts
import { getDb, type OfflineMessage } from "@/shared/lib/idb/db";

export async function enqueueOffline(msg: OfflineMessage): Promise<void> {
  const db = await getDb();
  await db.put("offlineQueue", msg);
}

export async function dequeueOffline(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("offlineQueue", id);
}

export async function listOffline(): Promise<OfflineMessage[]> {
  const db = await getDb();
  return db.getAllFromIndex("offlineQueue", "byCreatedAt");
}
