"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { isAllowedClientAction, isSafeInternalPath } from "@/lib/ai/client-actions";
import type { ClientActionName } from "@/lib/ai/modules/types";
import { requestAccessibilityPanel } from "@/lib/accessibility/open-event";
import { requestBrowserGeo, storeAiGeo } from "@/lib/ai/client-geo";
import { useAccessibilityStore } from "@/store/accessibility-store";

export type AiClientAction = {
  action: string;
  payload?: Record<string, unknown>;
};

export type AiClientActionOutcome = {
  applied: boolean;
  action?: ClientActionName;
  reason?: string;
};

const THEMES = new Set(["light", "dark", "system"]);
const ADOPTION_FILTER_KEYS = ["species", "sex", "size", "age", "city", "q"] as const;

/**
 * Aplica no navegador as ações CLIENT_ACTION devolvidas pela IA.
 * O servidor nunca executa JS — aqui só entram ações da allowlist.
 */
export function useAiClientActions() {
  const router = useRouter();
  const { setTheme } = useTheme();
  const toggle = useAccessibilityStore((s) => s.toggle);
  const setFontScale = useAccessibilityStore((s) => s.setFontScale);
  const increaseFont = useAccessibilityStore((s) => s.increaseFont);

  const enableFlag = useCallback(
    (key: "cognitiveMode" | "simplifiedUI" | "strongFocus") => {
      if (useAccessibilityStore.getState()[key]) return;
      toggle(key);
    },
    [toggle]
  );

  const apply = useCallback(
    ({ action, payload = {} }: AiClientAction): AiClientActionOutcome => {
      if (!isAllowedClientAction(action)) {
        return { applied: false, reason: "ACTION_NOT_ALLOWED" };
      }

      switch (action) {
        case "SET_THEME": {
          const theme = typeof payload.theme === "string" ? payload.theme.toLowerCase() : "";
          if (!THEMES.has(theme)) return { applied: false, action, reason: "INVALID_THEME" };
          setTheme(theme);
          return { applied: true, action };
        }

        case "SET_FONT_SCALE": {
          const raw = payload.scale ?? payload.fontScale ?? payload.value;
          const scale = typeof raw === "number" ? raw : Number(raw);
          if (Number.isFinite(scale) && scale > 0) {
            setFontScale(scale);
          } else {
            increaseFont();
          }
          return { applied: true, action };
        }

        case "ENABLE_SIMPLE_LANGUAGE":
          enableFlag("cognitiveMode");
          return { applied: true, action };

        case "ENABLE_SIMPLIFIED_UI":
          enableFlag("simplifiedUI");
          return { applied: true, action };

        case "ENABLE_STRONG_FOCUS":
          enableFlag("strongFocus");
          return { applied: true, action };

        case "OPEN_ACCESSIBILITY":
          return requestAccessibilityPanel()
            ? { applied: true, action }
            : { applied: false, action, reason: "NO_WINDOW" };

        case "OPEN_CART":
          router.push("/carrinho");
          return { applied: true, action };

        case "NAVIGATE": {
          const path = payload.path ?? payload.href ?? payload.url;
          if (!isSafeInternalPath(path)) {
            return { applied: false, action, reason: "UNSAFE_PATH" };
          }
          router.push(path);
          return { applied: true, action };
        }

        case "OPEN_ADOPTION_FILTERS": {
          router.push(withQuery("/adocao", pickStrings(payload, ADOPTION_FILTER_KEYS)));
          return { applied: true, action };
        }

        case "OPEN_MARKETPLACE_FILTERS": {
          const q = readString(payload.q ?? payload.query);
          if (q) {
            router.push(withQuery("/marketplace/busca", { q }));
            return { applied: true, action };
          }
          const cat = readString(payload.cat ?? payload.category);
          if (cat) {
            router.push(
              withQuery("/marketplace/produtos", { cat, sub: readString(payload.sub) })
            );
            return { applied: true, action };
          }
          router.push("/marketplace");
          return { applied: true, action };
        }

        case "REQUEST_GEOLOCATION": {
          const lat = payload.lat ?? payload.latitude;
          const lng = payload.lng ?? payload.longitude;
          if (typeof lat === "number" && typeof lng === "number") {
            storeAiGeo(lat, lng);
            return { applied: true, action };
          }
          void requestBrowserGeo();
          return { applied: true, action, reason: "GEO_PROMPTED" };
        }
      }
    },
    [enableFlag, increaseFont, router, setFontScale, setTheme]
  );

  return { apply };
}

function readString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().slice(0, 120);
  return trimmed || undefined;
}

function pickStrings(
  payload: Record<string, unknown>,
  keys: readonly string[]
): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  for (const key of keys) out[key] = readString(payload[key]);
  return out;
}

function withQuery(path: string, params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const qs = search.toString();
  return qs ? `${path}?${qs}` : path;
}
