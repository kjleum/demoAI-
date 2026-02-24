import { createContext, PropsWithChildren, useContext, useMemo, useState } from "react";

type Lang = "ru" | "en";
type Dict = Record<string, Record<Lang, string>>;

const dict: Dict = {
  "nav.chat": { ru: "Чат", en: "Chat" },
  "nav.projects": { ru: "Проекты", en: "Projects" },
  "nav.files": { ru: "Файлы", en: "Files" },
  "nav.history": { ru: "История", en: "History" },
  "nav.search": { ru: "Поиск", en: "Search" },
  "nav.settings": { ru: "Настройки", en: "Settings" },
  "nav.billing": { ru: "Биллинг", en: "Billing" },
  "nav.usage": { ru: "Usage", en: "Usage" },
  "nav.admin": { ru: "Админка", en: "Admin" },
  "nav.templates": { ru: "Шаблоны", en: "Templates" },
  "nav.tools": { ru: "Инструменты", en: "Tools" },
  "nav.onboarding": { ru: "Онбординг", en: "Onboarding" },
  "nav.apikeys": { ru: "API ключи", en: "API keys" }
};

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang)=>void; t: (k: string)=>string } | null>(null);

export function I18nProvider({ children }: PropsWithChildren) {
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem("lang") as Lang) || "ru");
  const t = useMemo(() => (k: string) => dict[k]?.[lang] ?? k, [lang]);
  const set = (l: Lang) => { setLang(l); localStorage.setItem("lang", l); };
  return <Ctx.Provider value={{ lang, setLang: set, t }}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("I18nProvider missing");
  return ctx;
}
