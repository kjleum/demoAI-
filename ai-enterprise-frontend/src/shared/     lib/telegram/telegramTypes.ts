// path: src/shared/lib/telegram/telegramTypes.ts
export type TelegramWebApp = {
  ready: () => void;
  expand: () => void;
  close: () => void;

  platform?: string;
  version?: string;
  colorScheme?: string;

  initData?: string;
  initDataUnsafe?: { user?: { id: number; first_name?: string; last_name?: string; username?: string } };

  themeParams?: Record<string, string | undefined>;

  BackButton: {
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
  };

  onEvent?: (event: string, cb: () => void) => void;

  HapticFeedback?: {
    impactOccurred: (style: "light" | "medium" | "heavy") => void;
    notificationOccurred: (type: "success" | "warning" | "error") => void;
    selectionChanged: () => void;
  };
};
