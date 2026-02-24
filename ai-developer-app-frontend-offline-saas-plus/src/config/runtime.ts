export type BackendMode = "local" | "remote";

export function getBackendMode(): BackendMode {
  const v = (import.meta.env.VITE_BACKEND_MODE as string | undefined) || "local";
  return v === "remote" ? "remote" : "local";
}
