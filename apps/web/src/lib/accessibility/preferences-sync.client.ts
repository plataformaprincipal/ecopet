import type { AccessibilityPreferences } from "@/lib/accessibility/types";
import { localApiSafe } from "@/lib/local-api.client";
import type { useAccessibilityStore } from "@/store/accessibility-store";

export const PREFERENCES_API = "/api/users/me/preferences";

type PreferencesResponse = {
  success: boolean;
  data?: { preferences?: { a11y?: Partial<AccessibilityPreferences>; locale?: string } };
};

export function pickA11yPreferences(
  state: ReturnType<typeof useAccessibilityStore.getState>
): AccessibilityPreferences {
  const {
    increaseFont: _a,
    decreaseFont: _b,
    resetFont: _c,
    increaseLetterSpacing: _d,
    decreaseLetterSpacing: _e,
    increaseLineHeight: _f,
    decreaseLineHeight: _g,
    toggle: _h,
    setLocale: _i,
    reset: _j,
    hasActiveSettings: _k,
    setVlibrasStatus: _l,
    vlibrasStatus: _m,
    toggleBraille: _n,
    ...rest
  } = state;
  return rest;
}

export type RemotePreferencesResult =
  | { ok: true; a11y: Partial<AccessibilityPreferences> | null }
  | { ok: false; unauthorized: boolean };

/** Carrega preferências do perfil. Retorna null em visitante, 401 ou falha — localStorage permanece fonte. */
export async function loadRemotePreferences(token: string): Promise<RemotePreferencesResult> {
  const result = await localApiSafe<PreferencesResponse>(PREFERENCES_API, { token });
  if (!result.ok) {
    return { ok: false, unauthorized: result.status === 401 };
  }
  return { ok: true, a11y: result.data.data?.preferences?.a11y ?? null };
}

/** Persiste preferências no perfil. Falhas (incl. 401) são silenciosas — localStorage continua válido. */
export async function saveRemotePreferences(
  token: string,
  a11y: AccessibilityPreferences
): Promise<{ ok: boolean; unauthorized: boolean }> {
  const result = await localApiSafe<PreferencesResponse>(PREFERENCES_API, {
    method: "PATCH",
    token,
    body: JSON.stringify({ a11y }),
  });
  return { ok: result.ok, unauthorized: !result.ok && result.status === 401 };
}
