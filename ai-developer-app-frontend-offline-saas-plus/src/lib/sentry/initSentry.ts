import * as Sentry from "@sentry/react";
import { getEnv } from "../../config/env";
import { logger } from "../logger/logger";

export function initSentry() {
  const env = getEnv();
  if (!env.enableSentry || !env.sentryDsn) {
    logger.info("[sentry] disabled");
    return;
  }

  Sentry.init({
    dsn: env.sentryDsn,
    environment: env.mode,
    tracesSampleRate: 0.2
  });

  window.addEventListener("error", (ev) => {
    // capture exception if present, else message
    // @ts-expect-error
    Sentry.captureException(ev.error ?? new Error(ev.message));
  });

  window.addEventListener("unhandledrejection", (ev) => {
    Sentry.captureException(ev.reason);
  });

  logger.info("[sentry] initialized");
}
