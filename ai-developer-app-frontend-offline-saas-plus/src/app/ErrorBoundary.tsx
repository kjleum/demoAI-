import React from "react";
import * as Sentry from "@sentry/react";
import { logger } from "../lib/logger/logger";
import { Button } from "../shared/ui/Button";

export class ErrorBoundary extends React.Component<React.PropsWithChildren, { crashed: boolean; error?: Error }> {
  state = { crashed: false, error: undefined as Error | undefined };

  static getDerivedStateFromError(error: Error) {
    return { crashed: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logger.error("[ErrorBoundary]", { error: String(error), info });
    Sentry.captureException(error);
  }

  render() {
    if (this.state.crashed) {
      return (
        <div style={{ padding: 16 }}>
          <h2 style={{ margin: "0 0 8px 0" }}>Приложение упало</h2>
          <div style={{ color: "var(--muted)", marginBottom: 12 }}>
            Включи overlay: <code>localStorage['debug:overlay']='1'</code> и обнови.
          </div>
          <pre style={{ whiteSpace: "pre-wrap", background: "var(--panel)", border: "1px solid var(--border)", padding: 12, borderRadius: 14 }}>
            {this.state.error?.stack || this.state.error?.message || "Unknown error"}
          </pre>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <Button onClick={() => location.reload()}>Reload</Button>
            <Button variant="ghost" onClick={() => navigator.clipboard.writeText(this.state.error?.stack || "").catch(()=>{})}>Copy stack</Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
