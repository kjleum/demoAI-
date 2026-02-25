// path: src/pages/NotFound.tsx
import React from "react";
import { Link } from "react-router-dom";

export function NotFound(): React.ReactElement {
  return (
    <div className="container">
      <div className="card">
        <div style={{ fontWeight: 950, fontSize: 18 }}>404</div>
        <div className="muted" style={{ marginTop: 6 }}>
          Страница не найдена
        </div>
        <div className="hr" />
        <Link className="btn primary" to="/chat">
          В чат
        </Link>
      </div>
    </div>
  );
}
