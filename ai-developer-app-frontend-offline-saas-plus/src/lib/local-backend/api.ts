import { idb } from "../db/idb";
import { sha256, randomToken } from "./crypto";
import type { ApiKey, Billing, FileItem, Message, Project, Session, Thread, Usage, User, Workspace, ThreadVersion } from "./types";

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export type Problem = { title: string; status: number; detail?: string; requestId?: string };

function problem(status: number, title: string, detail?: string, requestId?: string) {
  const p: Problem = { status, title, detail, requestId };
  const err = Object.assign(new Error(detail || title), { status, problem: p });
  return err;
}

async function requireSession(accessToken?: string) {
  if (!accessToken) throw problem(401, "Unauthorized", "missing token");
  const sessions = await idb.getAll<Session>("sessions");
  const s = sessions.find((x) => x.accessToken === accessToken);
  if (!s) throw problem(401, "Unauthorized", "invalid token");
  if (Date.now() > s.expiresAt) throw problem(401, "Unauthorized", "token expired");
  const u = await idb.get<User>("users", s.userId);
  if (!u) throw problem(401, "Unauthorized", "user missing");
  return { session: s, user: u };
}

export const localApi = {
  async health() {
    return { status: "ok" };
  },

  async login(email: string, password: string) {
    const users = await idb.getAll<User>("users");
    const u = users.find((x) => x.email.toLowerCase() === email.toLowerCase());
    if (!u) throw problem(401, "Unauthorized", "bad credentials");
    const hash = await sha256(password);
    if (hash !== u.passwordHash) throw problem(401, "Unauthorized", "bad credentials");

    const sess: Session = {
      id: randomToken("sess"),
      userId: u.id,
      accessToken: randomToken("atk"),
      createdAt: Date.now(),
      expiresAt: Date.now() + SESSION_TTL_MS
    };
    await idb.put("sessions", sess);
    return { accessToken: sess.accessToken, user: { id: u.id, email: u.email, role: u.role } };
  },

  async logout(accessToken?: string) {
    if (!accessToken) return;
    const sessions = await idb.getAll<Session>("sessions");
    const s = sessions.find((x) => x.accessToken === accessToken);
    if (s) await idb.delete("sessions", s.id);
  },

  async getWorkspaces(accessToken?: string) {
    await requireSession(accessToken);
    const stored = await idb.get<{ id: string; value: Workspace[] }>("settings", "workspaces");
    return stored?.value ?? [];
  },

  async getProjects(accessToken?: string, workspaceId?: string) {
    await requireSession(accessToken);
    if (!workspaceId) return await idb.getAll<Project>("projects");
    return await idb.getAllFromIndex<Project>("projects", "byWorkspace", workspaceId);
  },

  async createProject(accessToken: string | undefined, workspaceId: string, name: string) {
    await requireSession(accessToken);
    const p: Project = { id: crypto.randomUUID(), workspaceId, name, tags: [], createdAt: Date.now(), updatedAt: Date.now() };
    await idb.put("projects", p);
    return p;
  },

  async patchProject(accessToken: string | undefined, id: string, patch: Partial<Project>) {
    await requireSession(accessToken);
    const p = await idb.get<Project>("projects", id);
    if (!p) throw problem(404, "Not found", "project not found");
    const next: Project = { ...p, ...patch, updatedAt: Date.now() };
    await idb.put("projects", next);
    return next;
  },

  async getThreads(accessToken: string | undefined, projectId: string) {
    await requireSession(accessToken);
    return await idb.getAllFromIndex<Thread>("threads", "byProject", projectId);
  },

  async createThread(accessToken: string | undefined, projectId: string) {
    await requireSession(accessToken);
    const t: Thread = { id: crypto.randomUUID(), projectId, title: "New chat", tags: [], createdAt: Date.now(), updatedAt: Date.now() };
    await idb.put("threads", t);
    return t;
  },

  async setThreadTitle(accessToken: string | undefined, threadId: string, title: string) {
    await requireSession(accessToken);
    const t = await idb.get<Thread>("threads", threadId);
    if (!t) throw problem(404, "Not found", "thread not found");
    const next = { ...t, title, updatedAt: Date.now() };
    await idb.put("threads", next);
    return next;
  },

  async getMessages(accessToken: string | undefined, threadId: string) {
    await requireSession(accessToken);
    const msgs = await idb.getAllFromIndex<Message>("messages", "byThread", threadId);
    return msgs.sort((a,b)=>a.ts-b.ts);
  },

  async addMessage(accessToken: string | undefined, threadId: string, role: Message["role"], content: string) {
    await requireSession(accessToken);
    const m: Message = { id: crypto.randomUUID(), threadId, role, content, ts: Date.now() };
    await idb.put("messages", m);
    // update thread timestamp
    const t = await idb.get<Thread>("threads", threadId);
    if (t) await idb.put("threads", { ...t, updatedAt: Date.now() });
    // usage
    await localApi.bumpUsage(accessToken, content.length);
    return m;
  },

  async uploadFiles(accessToken: string | undefined, projectId: string, files: File[]) {
    await requireSession(accessToken);
    const out: Omit<FileItem, "blob">[] = [];
    let bytes = 0;
    for (const f of files) {
      bytes += f.size;
      const item: FileItem = { id: crypto.randomUUID(), projectId, name: f.name, type: f.type || "file", size: f.size, createdAt: Date.now(), blob: f };
      await idb.put("files", item);
      out.push({ ...item, blob: undefined as any });
    }
    await localApi.bumpStorage(accessToken, bytes);
    return out;
  },

  async listFiles(accessToken: string | undefined, projectId: string) {
    await requireSession(accessToken);
    const items = await idb.getAllFromIndex<FileItem>("files", "byProject", projectId);
    return items.map((x) => ({ ...x, blob: undefined as any }));
  },

  async downloadFile(accessToken: string | undefined, fileId: string) {
    await requireSession(accessToken);
    const item = await idb.get<FileItem>("files", fileId);
    if (!item) throw problem(404, "Not found", "file not found");
    return item;
  },

  async billing(accessToken?: string) {
    await requireSession(accessToken);
    return await idb.get<Billing>("billing", "current");
  },

  async changePlan(accessToken: string | undefined, plan: Billing["plan"]) {
    const { user } = await requireSession(accessToken);
    if (user.role !== "admin") throw problem(403, "Forbidden", "admin only");
    const current = await idb.get<Billing>("billing", "current");
    const limits = plan === "free"
      ? { requestsPerDay: 200, storageBytes: 1_000_000_000 }
      : plan === "pro"
      ? { requestsPerDay: 5_000, storageBytes: 10_000_000_000 }
      : { requestsPerDay: 50_000, storageBytes: 100_000_000_000 };
    const next: Billing = { id:"current", plan, status:"active", renewedAt: Date.now(), limits };
    await idb.put("billing", next);
    return next;
  },

  async usage(accessToken?: string) {
    await requireSession(accessToken);
    return await idb.get<Usage>("usage", "current");
  },

  async bumpUsage(accessToken: string | undefined, chars: number) {
    await requireSession(accessToken);
    const u = (await idb.get<Usage>("usage", "current")) || { id:"current", window:"30d", tokens:0, requests:0, storageBytes:0, updatedAt: Date.now() };
    const tokens = Math.max(1, Math.round(chars / 4));
    const next: Usage = { ...u, tokens: u.tokens + tokens, requests: u.requests + 1, updatedAt: Date.now() };
    await idb.put("usage", next);
    return next;
  },

  async bumpStorage(accessToken: string | undefined, bytes: number) {
    await requireSession(accessToken);
    const u = (await idb.get<Usage>("usage", "current")) || { id:"current", window:"30d", tokens:0, requests:0, storageBytes:0, updatedAt: Date.now() };
    const next: Usage = { ...u, storageBytes: u.storageBytes + bytes, updatedAt: Date.now() };
    await idb.put("usage", next);
    return next;
  },

  async listApiKeys(accessToken?: string) {
    await requireSession(accessToken);
    const stored = await idb.get<{ id: string; value: ApiKey[] }>("settings", "apiKeys");
    return stored?.value ?? [];
  },

  async createApiKey(accessToken: string | undefined, name: string) {
    await requireSession(accessToken);
    const stored = await idb.get<{ id: string; value: ApiKey[] }>("settings", "apiKeys");
    const list = stored?.value ?? [];
    const value = randomToken("sk");
    const item: ApiKey = { id: crypto.randomUUID(), name, prefix: value.slice(0, 8), value, createdAt: Date.now() };
    await idb.put("settings", { id: "apiKeys", value: [item, ...list] });
    return item;
  },

  async deleteApiKey(accessToken: string | undefined, id: string) {
    await requireSession(accessToken);
    const stored = await idb.get<{ id: string; value: ApiKey[] }>("settings", "apiKeys");
    const list = stored?.value ?? [];
    await idb.put("settings", { id: "apiKeys", value: list.filter((k) => k.id !== id) });
  },

  async listVersions(accessToken: string | undefined, threadId: string) {
    await requireSession(accessToken);
    const items = await idb.getAllFromIndex<ThreadVersion>("versions", "byThread", threadId);
    return items.sort((a,b)=>b.createdAt-a.createdAt);
  },

  async createVersion(accessToken: string | undefined, threadId: string, title?: string) {
    await requireSession(accessToken);
    const msgs = await localApi.getMessages(accessToken, threadId);
    const v: ThreadVersion = {
      id: crypto.randomUUID(),
      threadId,
      title: title || `Version • ${new Date().toLocaleString()}`,
      createdAt: Date.now(),
      messages: msgs
    };
    await idb.put("versions", v);
    return v;
  },

  async restoreVersion(accessToken: string | undefined, versionId: string) {
    await requireSession(accessToken);
    const v = await idb.get<ThreadVersion>("versions", versionId);
    if (!v) throw problem(404, "Not found", "version not found");

    const all = await idb.getAll<Message>("messages");
    for (const m of all) {
      if (m.threadId === v.threadId) await idb.delete("messages", m.id);
    }
    for (const m of v.messages) {
      await idb.put("messages", { ...m, id: crypto.randomUUID() });
    }
    return true;
  }
};
