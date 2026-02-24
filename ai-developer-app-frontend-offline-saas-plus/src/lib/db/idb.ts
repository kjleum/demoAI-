type StoreName = "users" | "sessions" | "projects" | "threads" | "messages" | "files" | "billing" | "usage" | "settings" | "versions";

const DB_NAME = "ai-dev-offline";
const DB_VERSION = 2;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;

      const make = (name: StoreName, keyPath: string) => {
        if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath });
      };

      make("users", "id");
      make("sessions", "id");
      make("projects", "id");
      make("threads", "id");
      make("messages", "id");
      make("files", "id");
      make("billing", "id");
      make("usage", "id");
      make("settings", "id");
      make("versions", "id");

      // indexes
      const projects = req.result.transaction!.objectStore("projects");
      if (!projects.indexNames.contains("byWorkspace")) projects.createIndex("byWorkspace", "workspaceId", { unique: false });

      const threads = req.result.transaction!.objectStore("threads");
      if (!threads.indexNames.contains("byProject")) threads.createIndex("byProject", "projectId", { unique: false });

      const messages = req.result.transaction!.objectStore("messages");
      if (!messages.indexNames.contains("byThread")) messages.createIndex("byThread", "threadId", { unique: false });

      const files = req.result.transaction!.objectStore("files");
      if (!files.indexNames.contains("byProject")) files.createIndex("byProject", "projectId", { unique: false });

      const versions = req.result.transaction!.objectStore("versions");
      if (!versions.indexNames.contains("byThread")) versions.createIndex("byThread", "threadId", { unique: false });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore<T>(store: StoreName, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const s = tx.objectStore(store);
    const req = fn(s);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export const idb = {
  get<T>(store: StoreName, key: string) {
    return withStore<T | undefined>(store, "readonly", (s) => s.get(key));
  },
  put<T>(store: StoreName, value: T) {
    return withStore<IDBValidKey>(store, "readwrite", (s) => s.put(value as any));
  },
  delete(store: StoreName, key: string) {
    return withStore<void>(store, "readwrite", (s) => s.delete(key) as any);
  },
  getAll<T>(store: StoreName) {
    return withStore<T[]>(store, "readonly", (s) => s.getAll());
  },
  getAllFromIndex<T>(store: StoreName, index: string, key: IDBValidKey) {
    return withStore<T[]>(store, "readonly", (s) => (s.index(index).getAll(key) as any));
  },
  clear(store: StoreName) {
    return withStore<void>(store, "readwrite", (s) => s.clear() as any);
  }
};

export async function resetDb() {
  const dbs = await indexedDB.databases?.();
  // optional
  await new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
    req.onblocked = () => resolve();
  });
}
