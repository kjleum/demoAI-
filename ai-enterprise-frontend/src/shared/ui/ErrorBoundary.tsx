// path: src/shared/ui/ErrorBoundary.tsx
import React from "react";
import { logger } from "@/shared/lib/logger/logger";

type Props = { children: React.ReactNode };
type State = { hasError: boolean; message?: string };

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = { hasError: false };

  static getDerivedStateFromError(err: unknown): State {
    return { hasError: true, message: err instanceof Error ? err.message : String(err) };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo): void {
    logger.error("react.error_boundary", { error: String(error), componentStack: info.componentStack });
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="container">
          <div className="card">
            <div style={{ fontWeight: 900, fontSize: 18 }}>Ошибка в UI</div>
            <div className="muted" style={{ marginTop: 8 }}>
              {this.state.message ?? "Unknown error"}
            </div>
            <div className="hr" />
            <button className="btn primary" onClick={() => window.location.reload()}>
              Перезагрузить
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
