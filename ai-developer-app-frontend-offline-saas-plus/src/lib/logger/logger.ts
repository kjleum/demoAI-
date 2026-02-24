export type LogLevel = "debug" | "info" | "warn" | "error";
const LEVELS: LogLevel[] = ["debug", "info", "warn", "error"];

export type LogEntry = { ts: number; level: LogLevel; message: string; data?: unknown };

const RING_MAX = 250;
const ring: LogEntry[] = [];

const getMinLevel = (): LogLevel => {
  const fromEnv = (import.meta.env.VITE_LOG_LEVEL as string | undefined) as LogLevel | undefined;
  const debug = localStorage.getItem("debug:log") === "1";
  return debug ? "debug" : (fromEnv || "info");
};

const shouldLog = (level: LogLevel) => LEVELS.indexOf(level) >= LEVELS.indexOf(getMinLevel());

function push(entry: LogEntry) {
  ring.push(entry);
  while (ring.length > RING_MAX) ring.shift();
  window.dispatchEvent(new CustomEvent("app:log", { detail: entry }));
}

function fmt(msg: string, data?: unknown) {
  if (data === undefined) return msg;
  try { return msg + " " + JSON.stringify(data); } catch { return msg + " " + String(data); }
}

export const logger = {
  ring: () => ring.slice(),
  debug: (message: string, data?: unknown) => {
    if (!shouldLog("debug")) return;
    push({ ts: Date.now(), level: "debug", message, data });
    // eslint-disable-next-line no-console
    console.log(message, data);
  },
  info: (message: string, data?: unknown) => {
    if (!shouldLog("info")) return;
    push({ ts: Date.now(), level: "info", message, data });
    // eslint-disable-next-line no-console
    console.info(message, data);
  },
  warn: (message: string, data?: unknown) => {
    if (!shouldLog("warn")) return;
    push({ ts: Date.now(), level: "warn", message, data });
    // eslint-disable-next-line no-console
    console.warn(message, data);
  },
  error: (message: string, data?: unknown) => {
    if (!shouldLog("error")) return;
    push({ ts: Date.now(), level: "error", message, data });
    // eslint-disable-next-line no-console
    console.error(message, data);
  },
  fmt
};
