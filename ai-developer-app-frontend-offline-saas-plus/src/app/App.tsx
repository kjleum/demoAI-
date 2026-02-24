import { ErrorBoundary } from "./ErrorBoundary";
import { Providers } from "./providers";
import { AppRouter } from "./router";
import { AuthGate } from "../features/auth/AuthGate";
import { Notifications } from "../lib/notifications/Notifications";
import { DebugOverlay } from "../lib/logger/DebugOverlay";

export function App() {
  return (
    <ErrorBoundary>
      <Providers>
        <AuthGate>
          <AppRouter />
        </AuthGate>
        <Notifications />
        <DebugOverlay />
      </Providers>
    </ErrorBoundary>
  );
}
