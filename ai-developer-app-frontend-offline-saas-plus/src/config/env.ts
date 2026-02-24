export type AppEnv = {
  mode: "development" | "production";
  basePath: string;
  apiBaseUrl: string;
  sentryDsn?: string;
  enableSentry: boolean;
};

export function getEnv(): AppEnv {
  const mode = import.meta.env.MODE as AppEnv["mode"];
  const basePath = import.meta.env.BASE_URL || "/";
  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) || "https://example.invalid";
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;

  // Debug toggles
  const enableSentry = (import.meta.env.VITE_SENTRY_ENABLED as string | undefined) !== "0";

  return { mode, basePath, apiBaseUrl, sentryDsn, enableSentry };
}
