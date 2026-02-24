import { useEffect } from "react";

type Hotkey = { combo: string; onTrigger: () => void; allowInInputs?: boolean };

function matches(combo: string, ev: KeyboardEvent) {
  const parts = combo.toLowerCase().split("+").map((s) => s.trim());
  const key = ev.key.toLowerCase();
  const needCtrl = parts.includes("ctrl") || parts.includes("cmd");
  const needShift = parts.includes("shift");
  const needAlt = parts.includes("alt");
  const targetKey = parts.find((p) => !["ctrl","cmd","shift","alt"].includes(p));
  const ctrl = ev.ctrlKey || ev.metaKey;
  if (!!needCtrl !== !!ctrl) return false;
  if (!!needShift !== !!ev.shiftKey) return false;
  if (!!needAlt !== !!ev.altKey) return false;
  if (!targetKey) return false;
  return targetKey === key;
}

export function useHotkeys(hotkeys: Hotkey[]) {
  useEffect(() => {
    const onKeyDown = (ev: KeyboardEvent) => {
      const tag = (ev.target as HTMLElement | null)?.tagName?.toLowerCase();
      const inInput = tag === "input" || tag === "textarea" || (ev.target as HTMLElement | null)?.isContentEditable;
      for (const hk of hotkeys) {
        if (inInput && !hk.allowInInputs) continue;
        if (matches(hk.combo, ev)) {
          ev.preventDefault();
          hk.onTrigger();
          return;
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [hotkeys]);
}
