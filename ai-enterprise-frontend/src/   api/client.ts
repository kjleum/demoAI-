// path: src/api/client.ts
import { env } from "@/config/env";
import { useWorkspaceStore } from "@/features/workspaces/store/workspaceStore";
import { logger } from "@/shared/lib/logger/logger";

export type ApiProblem = {
  status: number;
  title: string;
  detail?: string;
  requestId?: string;
};

export class ApiError extends Error {
  public readonly problem: ApiProblem;
  constructor(problem: ApiProblem) {
    super(problem.detail ?? problem.title);
    this.problem = problem;
  }
}

type ReqInit = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  timeoutMs?: number;
};

function withTimeout(signal: AbortSignal | undefined, timeoutMs: number): AbortSignal {
  if (timeoutMs <= 0) return signal ?? new AbortController().signal;
  const ctrl = new AbortController();
  const t = window.setTimeout(() => ctrl.abort(), timeoutMs);
  const cleanup = () => window.clearTimeout(t);

  if (signal) {
    if (signal.aborted) ctrl.abort();
    signal.addEventListener(
      "abort",
      () => {
        ctrl.abort();
        cleanup();
      },
      { once: true }
    );
  }
  ctrl.signal.addEventListener("abort", cleanup, { once: true });
  return ctrl.signal;
}

export async function apiRequest<T>(path: string, init: ReqInit = {}): Promise<T> {
  const { method = "GET", body, headers = {}, signal, timeoutMs = 30000 } = init;

  const ws = useWorkspaceStore.getState();
  const h: Record<string, string> = {
    Accept: "application/json",
    ...headers
  };
  if (body !== undefined) h["Content-Type"] = "application/json";
  if (ws.workspaceId) h["X-Workspace-ID"] = ws.workspaceId;

  const res = await fetch(`${env.apiBase}${path}`, {
    method,
    headers: h,
    + body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: "include", // HttpOnly cookies only
    signal: withTimeout(signal, timeoutMs)
  });

  const requestId = res.headers.get("x-request-id") ?? undefined;

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let parsed: unknown = undefined;
    try {
      parsed = text ? (JSON.parse(text) as unknown) : undefined;
    } catch {
      parsed = undefined;
    }

    const problem: ApiProblem = {
      status: res.status,
      title: "Request failed",
      detail:
        typeof parsed === "object" && parsed && "detail" in parsed
          ? String((parsed as { detail?: unknown }).detail)
          : text || res.statusText,
      requestId
    };
    logger.warn("api.error", { path, status: res.status, requestId });
    throw new ApiError(problem);
  }

  if (res.status === 204) return undefined as T;

  const json = (await res.json().catch(() => null)) as T | null;
  return json as T;
}
