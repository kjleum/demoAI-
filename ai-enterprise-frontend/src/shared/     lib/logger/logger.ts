// path: src/shared/lib/logger/logger.ts
import type { LogLevel } from "@/config/env";
import { env } from "@/config/env";

const levelOrder: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: 99
};

type LogMeta = Record<string, unknown>;

function shouldLog(lvl: LogLevel): boolean {
  return levelOrder[lvl] >= levelOrder[env.logLevel];
}

function safeMeta(meta?: LogMeta): LogMeta | undefined {
  if (!meta) return undefined;
  try {
    // avoid cyclic
    return JSON.parse(JSON.stringify(meta)) as LogMeta;
  } catch {
    return { meta_unserializable: true };
  }
}

export const logger = {
  debug(msg: string, meta?: LogMeta) {
    if (!shouldLog("debug")) return;
    // eslint-disable-next-line no-console
    console.debug(`[debug] ${msg}`, safeMeta(meta));
  },
  info(msg: string, meta?: LogMeta) {
    if (!shouldLog("info")) return;
    // eslint-disable-next-line no-console
    console.info(`[info] ${msg}`, safeMeta(meta));
  },
  warn(msg: string, meta?: LogMeta) {
    if (!shouldLog("warn")) return;
    // eslint-disable-next-line no-console
    console.warn(`[warn] ${msg}`, safeMeta(meta));
  },
  error(msg: string, meta?: LogMeta) {
    if (!shouldLog("error")) return;
    // eslint-disable-next-line no-console
    console.error(`[error] ${msg}`, safeMeta(meta));
  }
};
