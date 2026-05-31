"use client";

import dynamic from "next/dynamic";

const AccessibilityToolbar = dynamic(
  () =>
    import("@/components/accessibility/accessibility-toolbar").then((m) => ({
      default: m.AccessibilityToolbar,
    })),
  { ssr: false, loading: () => null }
);

export function AccessibilityToolbarLazy() {
  return <AccessibilityToolbar />;
}
