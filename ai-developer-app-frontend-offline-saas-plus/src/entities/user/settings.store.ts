import { create } from "zustand";

type Theme = "dark" | "light";
type Settings = {
  theme: Theme;
  model: string;
  temperature: number;
  setTheme: (t: Theme) => void;
  setModel: (m: string) => void;
  setTemperature: (v: number) => void;
};

export const useSettingsStore = create<Settings>((set, get) => ({
  theme: (localStorage.getItem("theme") as Theme) || "dark",
  model: localStorage.getItem("model") || "gpt-4.1-mini",
  temperature: Number(localStorage.getItem("temperature") || "0.7"),
  setTheme: (t) => { localStorage.setItem("theme", t); document.documentElement.dataset.theme = t; set({ theme: t }); },
  setModel: (m) => { localStorage.setItem("model", m); set({ model: m }); },
  setTemperature: (v) => { localStorage.setItem("temperature", String(v)); set({ temperature: v }); }
}));
