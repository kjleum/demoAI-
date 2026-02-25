// path: src/shared/lib/telegram/getTelegram.ts
import type { TelegramWebApp } from "@/shared/lib/telegram/telegramTypes";

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

export function getTelegram(): TelegramWebApp | null {
  return window.Telegram?.WebApp ?? null;
}
