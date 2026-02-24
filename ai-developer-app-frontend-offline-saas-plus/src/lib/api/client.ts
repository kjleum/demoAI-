import { getEnv } from "../../config/env";
import { http } from "./http";
import { useAuthStore } from "../../entities/user/auth.store";


const env = getEnv();

async function local() {
  const mod = await import("../local-backend/api");
  return mod.localApi;
}

async function authToken() {
  const { useAuthStore } = await import("../../entities/user/auth.store");
  return useAuthStore.getState().accessToken;
}

export const apiClient = {
  async get<T>(path: string, signal?: AbortSignal) {
    const mode = (await import("../../config/runtime")).getBackendMode();
    const token = await authToken();

    if (mode === "local") {
      const api = await local();
      // map paths
      if (path === "/v1/health") return { data: (await api.health()) as any as T, requestId: "local" };
      if (path === "/v1/usage") return { data: (await api.usage(token)) as any as T, requestId: "local" };
      if (path === "/v1/projects") return { data: ({ items: await api.getProjects(token) } as any) as T, requestId: "local" };
      if (path === "/v1/api-keys") return { data: ({ items: await api.listApiKeys(token) } as any) as T, requestId: "local" };
      throw new Error(`Local GET not implemented: ${path}`);
    }

    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    const { http } = await import("./http");
    return http<T>(`${env.apiBaseUrl}${path}`, { method: "GET", headers, signal });
  },

  async post<T>(path: string, body: unknown, signal?: AbortSignal) {
    const mode = (await import("../../config/runtime")).getBackendMode();
    const token = await authToken();

    if (mode === "local") {
      const api = await local();
      if (path === "/v1/login") {
        const b = body as any;
        return { data: (await api.login(String(b.email), String(b.password))) as any as T, requestId: "local" };
      }
      if (path === "/v1/projects") {
        const b = body as any;
        // local uses default workspace w1
        return { data: (await api.createProject(token, "w1", String(b.name))) as any as T, requestId: "local" };
      }
      if (path === "/v1/api-keys") {
        const b = body as any;
        return { data: (await api.createApiKey(token, String(b.name))) as any as T, requestId: "local" };
      }
      throw new Error(`Local POST not implemented: ${path}`);
    }

    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    const { http } = await import("./http");
    return http<T>(`${env.apiBaseUrl}${path}`, { method: "POST", headers, body, signal, idempotent: false, retries: 0 });
  }
};
