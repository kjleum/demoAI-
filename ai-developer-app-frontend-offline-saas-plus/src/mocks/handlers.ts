import { http, HttpResponse, delay } from "msw";

const json = (data: unknown, init?: ResponseInit) => HttpResponse.json(data, init);

let projects = [
  { id: "p1", name: "Demo Project", tags: ["demo"], createdAt: Date.now() - 86400000 },
  { id: "p2", name: "Client Workspace", tags: ["client"], createdAt: Date.now() - 3600000 }
];

let apiKeys = [
  { id: "k1", name: "Default", prefix: "sk-demo", createdAt: Date.now() - 500000 }
];

export const handlers = [
  http.get("*/v1/health", async () => {
    await delay(120);
    return json({ status: "ok" });
  }),

  http.get("*/v1/projects", async () => {
    await delay(200);
    return json({ items: projects });
  }),

  http.post("*/v1/projects", async ({ request }) => {
    const body = (await request.json()) as any;
    const p = { id: crypto.randomUUID(), name: String(body?.name || "Untitled"), tags: [], createdAt: Date.now() };
    projects = [p, ...projects];
    await delay(200);
    return json(p, { status: 201 });
  }),

  http.get("*/v1/api-keys", async () => {
    await delay(160);
    return json({ items: apiKeys });
  }),

  http.post("*/v1/api-keys", async ({ request }) => {
    const body = (await request.json()) as any;
    const value = "sk_" + Math.random().toString(36).slice(2);
    const item = { id: crypto.randomUUID(), name: String(body?.name || "Key"), prefix: value.slice(0, 8), createdAt: Date.now(), value };
    apiKeys = [item, ...apiKeys];
    await delay(220);
    return json(item, { status: 201 });
  }),

  http.delete("*/v1/api-keys/:id", async ({ params }) => {
    const id = String(params.id);
    apiKeys = apiKeys.filter((k) => k.id !== id);
    await delay(120);
    return new HttpResponse(null, { status: 204 });
  }),

  http.get("*/v1/usage", async () => {
    await delay(220);
    return json({
      window: "30d",
      tokens: Math.floor(2_500_000 + Math.random() * 800_000),
      requests: Math.floor(4_000 + Math.random() * 1200),
      storageBytes: Math.floor(2_000_000_000 + Math.random() * 600_000_000)
    });
  })
];
