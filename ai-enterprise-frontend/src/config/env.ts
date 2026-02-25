// path: src/config/env.ts
export type LogLevel = "debug" | "info" | "warn" | "error" | "silent";

export const env = {
  apiBase: (import.meta.env.VITE_API_BASE as string | undefined) ?? "/api/v1",
  wsBase: (import.meta.env.VITE_WS_BASE as string | undefined) ?? "",
  defaultMode: (import.meta.env.VITE_APP_DEFAULT_MODE as string | undefined) ?? "guest",
  logLevel: ((import.meta.env.VITE_LOG_LEVEL as string | undefined) ?? "info") as LogLevel,
  tgForceEnable: ((import.meta.env.VITE_TG_FORCE_ENABLE as string | undefined) ?? "false") === "true"
} as const;
