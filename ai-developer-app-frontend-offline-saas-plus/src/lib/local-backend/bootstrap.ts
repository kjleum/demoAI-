import { idb } from "../db/idb";
import { sha256, randomToken } from "./crypto";
import type { Billing, Project, Thread, Usage, User, Workspace } from "./types";

export async function ensureBootstrapped() {
  // Create default admin user if missing
  const users = await idb.getAll<User>("users");
  if (users.length === 0) {
    const admin: User = {
      id: "u_admin",
      email: "admin@local",
      passwordHash: await sha256("admin"),
      role: "admin",
      createdAt: Date.now()
    };
    const user: User = {
      id: "u_user",
      email: "user@local",
      passwordHash: await sha256("user"),
      role: "user",
      createdAt: Date.now()
    };
    await idb.put("users", admin);
    await idb.put("users", user);

    // Default billing/usage
    const billing: Billing = {
      id: "current",
      plan: "free",
      status: "active",
      renewedAt: Date.now(),
      limits: { requestsPerDay: 200, storageBytes: 1_000_000_000 }
    };
    const usage: Usage = { id: "current", window: "30d", tokens: 0, requests: 0, storageBytes: 0, updatedAt: Date.now() };
    await idb.put("billing", billing);
    await idb.put("usage", usage);

    // Workspaces+project+thread
    const ws1: Workspace = { id: "w1", name: "Personal", createdAt: Date.now() };
    const ws2: Workspace = { id: "w2", name: "Team", createdAt: Date.now() };
    await idb.put("settings", { id: "workspaces", value: [ws1, ws2] });

    const project: Project = { id: "p1", workspaceId: "w1", name: "Demo Project", tags: ["demo"], createdAt: Date.now(), updatedAt: Date.now() };
    await idb.put("projects", project);

    const thread: Thread = { id: "t1", projectId: "p1", title: "New chat", tags: [], createdAt: Date.now(), updatedAt: Date.now() };
    await idb.put("threads", thread);

    await idb.put("messages", { id: "m1", threadId: "t1", role: "assistant", content: "Offline-first платформа готова. Логин: user@local/user или admin@local/admin", ts: Date.now() });
  }
}
