import { logger } from "../logger/logger";
import { newRequestId } from "../request-id/requestId";

export type ProblemDetails = {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  requestId?: string;
  [k: string]: unknown;
};

export class HttpError extends Error {
  status: number;
  problem?: ProblemDetails;
  requestId?: string;
  constructor(message: string, status: number, problem?: ProblemDetails, requestId?: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.problem = problem;
    this.requestId = requestId;
  }
}

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type HttpOptions = {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
  signal?: AbortSignal;
  idempotent?: boolean;
  retries?: number;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function safeJson(text: string) {
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

export async function http<T>(url: string, opts: HttpOptions = {}): Promise<{ data: T; requestId: string }> {
  const method = opts.method ?? "GET";
  const timeoutMs = opts.timeoutMs ?? 30000;
  const idempotent = opts.idempotent ?? method === "GET";
  const retries = opts.retries ?? (idempotent ? 2 : 0);

  const requestId = newRequestId();
  const ctrl = new AbortController();
  const onAbort = () => ctrl.abort();
  if (opts.signal) opts.signal.addEventListener("abort", onAbort, { once: true });

  const timer = window.setTimeout(() => ctrl.abort(), timeoutMs);

  const attemptFetch = async () => {
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Request-ID": requestId,
        ...(opts.headers ?? {})
      },
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      signal: ctrl.signal,
      credentials: "include"
    });

    const text = await res.text();
    const payload = text ? safeJson(text) : null;

    if (!res.ok) {
      const problem: ProblemDetails | undefined = payload && typeof payload === "object" ? payload : undefined;
      const msg = (problem?.detail || problem?.title || `HTTP ${res.status}`) as string;
      throw new HttpError(msg, res.status, problem, requestId);
    }

    return payload as T;
  };

  try {
    let attempt = 0;
    while (true) {
      try {
        logger.debug("[http] request", { method, url, requestId });
        const data = await attemptFetch();
        logger.debug("[http] response", { method, url, requestId });
        return { data, requestId };
      } catch (e) {
        attempt++;
        logger.warn("[http] error", { method, url, requestId, attempt, error: String(e) });
        if (attempt > retries) throw e;
        await sleep(250 * attempt);
      }
    }
  } finally {
    window.clearTimeout(timer);
    if (opts.signal) opts.signal.removeEventListener("abort", onAbort);
  }
}
