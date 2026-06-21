"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { LocaleCode } from "@/i18n/locales/registry";
import { normalizeLocale } from "@/i18n/detect";
import { useTranslation } from "@/providers/i18n-provider";
import { cn } from "@/lib/utils";

/** Idiomas principais exibidos no header global — nomes completos fixos. */
export const HEADER_LOCALES: { code: LocaleCode; label: string }[] = [
  { code: "pt-BR", label: "Português" },
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
];

interface LanguageSelectorProps {
  className?: string;
  /** Compacto para barras estreitas (mobile). */
  compact?: boolean;
}

export function LanguageSelector({ className, compact }: LanguageSelectorProps) {
  const { locale, setLocale, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const triggerId = useId();

  const headerCodes = new Set(HEADER_LOCALES.map((l) => l.code));
  const activeCode = headerCodes.has(locale) ? locale : "pt-BR";
  const active = HEADER_LOCALES.find((l) => l.code === activeCode) ?? HEADER_LOCALES[0];

  const handleSelect = useCallback(
    (code: LocaleCode) => {
      const normalized = normalizeLocale(code) ?? code;
      setLocale(normalized);
      setOpen(false);
      triggerRef.current?.focus();
    },
    [setLocale]
  );

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function handleMenuKeyDown(e: React.KeyboardEvent, index: number) {
    const last = HEADER_LOCALES.length - 1;
    let next = index;

    if (e.key === "ArrowDown") next = index >= last ? 0 : index + 1;
    else if (e.key === "ArrowUp") next = index <= 0 ? last : index - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = last;
    else return;

    e.preventDefault();
    const btn = containerRef.current?.querySelector<HTMLButtonElement>(
      `[data-lang-index="${next}"]`
    );
    btn?.focus();
  }

  return (
    <div ref={containerRef} className={cn("relative inline-flex shrink-0", className)}>
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        aria-label={t("lang.selector.label")}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            setOpen(true);
            const index = e.key === "ArrowDown" ? 0 : HEADER_LOCALES.length - 1;
            requestAnimationFrame(() => {
              containerRef.current
                ?.querySelector<HTMLButtonElement>(`[data-lang-index="${index}"]`)
                ?.focus();
            });
          }
        }}
        className={cn(
          "inline-flex items-center gap-1 rounded-xl border border-ecopet-gray/15",
          "bg-white/80 font-medium text-ecopet-dark shadow-sm backdrop-blur-md",
          "transition-colors duration-200 hover:border-ecopet-green/30 hover:bg-white hover:shadow-md",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ecopet-green/35 focus-visible:ring-offset-2",
          "dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:border-emerald-500/40",
          compact ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm"
        )}
      >
        <span className="whitespace-nowrap">{active.label}</span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </button>

      <ul
        id={menuId}
        role="listbox"
        aria-labelledby={triggerId}
        aria-label={t("lang.selector.openMenu")}
        aria-hidden={!open}
        className={cn(
          "absolute right-0 top-[calc(100%+0.375rem)] z-50 min-w-[10.5rem] overflow-hidden rounded-xl",
          "border border-ecopet-gray/12 bg-white shadow-lg",
          "dark:border-white/10 dark:bg-ecopet-dark-card",
          "origin-top transition-all duration-200 ease-out",
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-1 opacity-0"
        )}
      >
        {HEADER_LOCALES.map((loc, index) => {
          const selected = loc.code === activeCode;
          return (
            <li key={loc.code} role="presentation">
              <button
                type="button"
                role="option"
                data-lang-index={index}
                aria-selected={selected}
                tabIndex={open ? 0 : -1}
                onClick={() => handleSelect(loc.code)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSelect(loc.code);
                    return;
                  }
                  handleMenuKeyDown(e, index);
                }}
                className={cn(
                  "flex w-full items-center px-3.5 py-2.5 text-left text-sm transition-colors duration-150",
                  "focus-visible:outline-none focus-visible:bg-emerald-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ecopet-green/30",
                  selected
                    ? "bg-emerald-50/90 font-semibold text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
                    : "text-ecopet-dark hover:bg-gray-50 dark:text-white dark:hover:bg-white/5",
                  compact ? "py-2 text-xs" : "py-2.5 text-sm"
                )}
              >
                {loc.label}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
