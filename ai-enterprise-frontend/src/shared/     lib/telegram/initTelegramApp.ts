// path: src/shared/lib/telegram/initTelegramApp.ts
import { env } from "@/config/env";
import { logger } from "@/shared/lib/logger/logger";
import { getTelegram } from "@/shared/lib/telegram/getTelegram";

function setCssVar(name: string, value?: string): void {
  if (!value) return;
  document.documentElement.style.setProperty(name, value);
}

export function initTelegramApp(): void {
  const tg = getTelegram();
  if (!tg && !env.tgForceEnable) return;

  if (!tg && env.tgForceEnable) {
    logger.warn("tg.force_enable=true but Telegram WebApp not detected");
    return;
  }

  try {
    tg!.ready();
    tg!.expand();

    const p = tg!.themeParams ?? {};
    setCssVar("--bg", p.bg_color);
    setCssVar("--text", p.text_color);
    setCssVar("--muted", p.hint_color);
    setCssVar("--accent", p.button_color);

    if (p.hint_color) setCssVar("--line", `${p.hint_color}33`);

    tg!.onEvent?.("themeChanged", () => {
      const pp = tg!.themeParams ?? {};
      setCssVar("--bg", pp.bg_color);
      setCssVar("--text", pp.text_color);
      setCssVar("--muted", pp.hint_color);
      setCssVar("--accent", pp.button_color);
      if (pp.hint_color) setCssVar("--line", `${pp.hint_color}33`);
    });

    tg!.onEvent?.("viewportChanged", () => {
      logger.debug("tg.viewportChanged");
    });

    logger.info("tg.ready", {
      platform: tg!.platform,
      version: tg!.version,
      scheme: tg!.colorScheme
    });
  } catch (e) {
    logger.error("tg.init_failed", { err: String(e) });
  }
}
