"use client";

import dynamic from "next/dynamic";
import { Accessibility } from "lucide-react";

/** FAB estável durante o carregamento do painel — evita “sumiço” na hidratação. */
function AccessibilityFabShell() {
  return (
    <div
      className="a11y-toolbar-root bottom-28 left-4 lg:bottom-6"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      role="region"
      aria-label="Acessibilidade"
    >
      <button
        type="button"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-ecopet-green text-white shadow-lg"
        aria-busy="true"
        aria-label="Carregando acessibilidade"
        title="Acessibilidade"
        disabled
      >
        <Accessibility className="h-6 w-6" aria-hidden />
      </button>
    </div>
  );
}

const AccessibilityToolbar = dynamic(
  () =>
    import("@/components/shared/accessibility/accessibility-toolbar").then((m) => ({
      default: m.AccessibilityToolbar,
    })),
  { ssr: false, loading: () => <AccessibilityFabShell /> }
);

export function AccessibilityToolbarLazy() {
  return <AccessibilityToolbar />;
}
