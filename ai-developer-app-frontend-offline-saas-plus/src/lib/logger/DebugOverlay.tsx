import { useEffect, useMemo, useState } from "react";
import { logger, LogEntry } from "./logger";

const fmt = (e: LogEntry) => {
  const t = new Date(e.ts).toLocaleTimeString();
  const data = e.data === undefined ? "" : (() => { try { return JSON.stringify(e.data); } catch { return String(e.data); } })();
  return `[${t}] ${e.level.toUpperCase()}: ${e.message}${data ? " " + data : ""}`;
};

export function DebugOverlay() {
  const enabled = useMemo(() => localStorage.getItem("debug:overlay") === "1", []);
  const [lines, setLines] = useState<string[]>(() => logger.ring().slice(-80).map(fmt));

  useEffect(() => {
    if (!enabled) return;
    const onLog = (ev: Event) => {
      const entry = (ev as CustomEvent<LogEntry>).detail;
      setLines((prev) => [...prev.slice(-79), fmt(entry)]);
    };
    window.addEventListener("app:log", onLog as EventListener);
    return () => window.removeEventListener("app:log", onLog as EventListener);
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div style={{
      position: "fixed", right: 10, bottom: 10, zIndex: 99999,
      width: "min(560px, 92vw)", maxHeight: "55vh", overflow: "auto",
      background: "rgba(0,0,0,.85)", color: "#fff",
      border: "1px solid rgba(255,255,255,.18)", borderRadius: 14, padding: 10,
      font: "12px/1.4 system-ui"
    }}>
      <div style={{display:"flex", justifyContent:"space-between", gap:8, alignItems:"center"}}>
        <b>Debug</b>
        <div style={{display:"flex", gap:8}}>
          <button onClick={() => navigator.clipboard.writeText(lines.join("\n")).catch(()=>{})}>Copy</button>
          <button onClick={() => setLines([])}>Clear</button>
          <button onClick={() => { localStorage.removeItem("debug:overlay"); location.reload(); }}>Off</button>
        </div>
      </div>
      <pre style={{whiteSpace:"pre-wrap", margin:"8px 0 0 0"}}>{lines.join("\n")}</pre>
    </div>
  );
}
