"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function MarketplaceOverlay({
  open,
  onClose,
  title,
  description,
  testId,
  placement = "center",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  testId: string;
  placement?: "center" | "bottom";
  children: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    let armed = false;
    const arm = window.setTimeout(() => {
      armed = true;
    }, 0);

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCloseRef.current();
    }

    function onPointerDown(e: PointerEvent) {
      if (!armed) return;
      const panel = panelRef.current;
      if (panel && !panel.contains(e.target as Node)) onCloseRef.current();
    }

    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.clearTimeout(arm);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  const titleId = `${testId}-title`;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-end justify-center sm:items-center" role="presentation">
      <div className="absolute inset-0 bg-black/50" aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-testid={testId}
        className={cn(
          "relative z-10 w-full max-w-lg overflow-y-auto border border-[var(--ep-border)] bg-[var(--ep-bg-elevated)] p-6 text-[var(--ep-fg)] shadow-[var(--shadow-floating)]",
          placement === "bottom"
            ? "max-h-[85vh] rounded-t-3xl sm:max-h-[90vh] sm:rounded-3xl"
            : "mx-4 max-h-[90vh] rounded-3xl"
        )}
      >
        <button
          type="button"
          className="absolute right-4 top-4 rounded-lg p-1.5 text-[var(--ep-fg-muted)] hover:bg-[var(--ep-bg-muted)]"
          aria-label="Fechar"
          onClick={onClose}
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
        <h2 id={titleId} className="pr-8 font-display text-lg font-bold">
          {title}
        </h2>
        {description ? <p className="mt-1 text-sm text-[var(--ep-fg-muted)]">{description}</p> : null}
        <div className="mt-4">{children}</div>
      </div>
    </div>,
    document.body
  );
}
