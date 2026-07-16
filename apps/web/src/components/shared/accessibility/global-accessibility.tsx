"use client";

import { Suspense } from "react";
import { AccessibilityToolbarLazy } from "@/components/shared/accessibility/accessibility-toolbar-lazy";
import { VLibrasWidget } from "@/components/accessibility/VLibrasWidget";

/**
 * Camada global de acessibilidade — montada uma única vez no layout raiz.
 * Independente de autenticação, role, middleware ou shells de área.
 * Não duplicar em layouts filhos.
 */
export function GlobalAccessibility() {
  return (
    <>
      <AccessibilityToolbarLazy />
      <Suspense fallback={null}>
        <VLibrasWidget />
      </Suspense>
    </>
  );
}
