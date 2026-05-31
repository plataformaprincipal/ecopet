"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Accessibility,
  Type,
  Minus,
  Plus,
  Contrast,
  Palette,
  RotateCcw,
  X,
  ChevronDown,
  Eye,
  Brain,
  Hand,
  HandMetal,
  Volume2,
  BookOpen,
  Languages,
  Link2,
  Focus,
  MousePointer2,
  ScanEye,
  Ruler,
  PauseCircle,
  VolumeX,
  Sparkles,
  Minimize2,
  Settings2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useAccessibilityStore,
  FONT_SCALE_MIN,
  FONT_SCALE_MAX,
} from "@/store/accessibility-store";
import { useTranslation } from "@/providers/i18n-provider";
import { useAriaAnnounce } from "./aria-live-region";
import { LanguageSelector } from "@/components/i18n/language-selector";

export function AccessibilityToolbar() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const announce = useAriaAnnounce();
  const { t } = useTranslation();

  const store = useAccessibilityStore();
  const {
    fontScale,
    increaseFont,
    decreaseFont,
    resetFont,
    increaseLetterSpacing,
    increaseLineHeight,
    toggle,
    reset,
    hasActiveSettings,
  } = store;

  const atMin = fontScale <= FONT_SCALE_MIN;
  const atMax = fontScale >= FONT_SCALE_MAX;

  const handleToggle = useCallback(
    (key: Parameters<typeof toggle>[0], label: string) => {
      toggle(key);
      const active = !store[key];
      announce(`${label} ${active ? t("a11y.activated") : t("a11y.deactivated")}`, "polite");
    },
    [toggle, store, announce, t]
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="a11y-toolbar-root bottom-24 left-4 lg:bottom-6" role="region" aria-label={t("a11y.title")}>
      <AnimatePresence>
        {open && !minimized && (
          <motion.div
            ref={panelRef}
            id="ecopet-a11y-toolbar"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="mb-3 flex max-h-[min(75vh,620px)] w-[min(calc(100vw-2rem),360px)] flex-col overflow-hidden rounded-2xl border border-ecopet-green/25 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0f1419]"
          >
            <div className="flex shrink-0 items-center justify-between bg-ecopet-dark px-4 py-3 text-white">
              <div className="flex items-center gap-2">
                <Accessibility className="h-5 w-5 text-ecopet-yellow" aria-hidden />
                <span className="font-display text-sm font-bold">{t("a11y.title")}</span>
              </div>
              <div className="flex gap-1">
                <IconBtn icon={Minimize2} label="Minimizar" onClick={() => setMinimized(true)} />
                <IconBtn icon={X} label={t("a11y.close")} onClick={() => setOpen(false)} />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              <Section title={t("a11y.sections.visual")} icon={Eye} defaultOpen>
                <ToolBtn icon={Plus} label={t("a11y.labels.increaseFont")} onClick={increaseFont} disabled={atMax} />
                <ToolBtn icon={Minus} label={t("a11y.labels.decreaseFont")} onClick={decreaseFont} disabled={atMin} />
                <ToolBtn icon={RotateCcw} label={t("a11y.labels.resetFont")} onClick={resetFont} />
                <ToolBtn icon={Type} label={t("a11y.labels.letterSpacing")} onClick={increaseLetterSpacing} />
                <ToolBtn icon={Type} label={t("a11y.labels.lineHeight")} onClick={increaseLineHeight} />
                <ToggleBtn icon={Contrast} label={t("a11y.labels.highContrast")} active={store.highContrast} onClick={() => handleToggle("highContrast", t("a11y.labels.highContrast"))} />
                <ToggleBtn icon={Contrast} label={t("a11y.labels.invertedContrast")} active={store.invertedContrast} onClick={() => handleToggle("invertedContrast", t("a11y.labels.invertedContrast"))} />
                <ToggleBtn icon={Palette} label={t("a11y.labels.grayscale")} active={store.grayscale} onClick={() => handleToggle("grayscale", t("a11y.labels.grayscale"))} />
                <ToggleBtn icon={Eye} label={t("a11y.labels.colorBlind")} active={store.colorBlindMode} onClick={() => handleToggle("colorBlindMode", t("a11y.labels.colorBlind"))} />
                <ToggleBtn icon={Link2} label={t("a11y.labels.highlightLinks")} active={store.highlightLinks} onClick={() => handleToggle("highlightLinks", t("a11y.labels.highlightLinks"))} />
                <ToggleBtn icon={Focus} label={t("a11y.labels.strongFocus")} active={store.strongFocus} onClick={() => handleToggle("strongFocus", t("a11y.labels.strongFocus"))} />
                <ToggleBtn icon={MousePointer2} label={t("a11y.labels.largeCursor")} active={store.largeCursor} onClick={() => handleToggle("largeCursor", t("a11y.labels.largeCursor"))} />
              </Section>

              <Section title={t("a11y.sections.auditory")} icon={Volume2}>
                <ToggleBtn icon={VolumeX} label={t("a11y.labels.visualAlerts")} active={store.visualAlerts} onClick={() => handleToggle("visualAlerts", t("a11y.labels.visualAlerts"))} />
                <ToggleBtn icon={VolumeX} label={t("a11y.labels.reduceNotifications")} active={store.reduceVisualNotifications} onClick={() => handleToggle("reduceVisualNotifications", t("a11y.labels.reduceNotifications"))} />
              </Section>

              <Section title={t("a11y.sections.cognitive")} icon={Brain}>
                <ToggleBtn icon={Brain} label={t("a11y.labels.cognitive")} active={store.cognitiveMode} onClick={() => handleToggle("cognitiveMode", t("a11y.labels.cognitive"))} />
                <ToggleBtn icon={Minimize2} label={t("a11y.labels.simplified")} active={store.simplifiedUI} onClick={() => handleToggle("simplifiedUI", t("a11y.labels.simplified"))} />
              </Section>

              <Section title={t("a11y.sections.motor")} icon={Hand}>
                <ToggleBtn icon={Hand} label={t("a11y.labels.motor")} active={store.motorMode} onClick={() => handleToggle("motorMode", t("a11y.labels.motor"))} />
              </Section>

              <Section title={t("a11y.sections.neuro")} icon={Sparkles}>
                <ToggleBtn icon={Sparkles} label={t("a11y.labels.calm")} active={store.calmMode} onClick={() => handleToggle("calmMode", t("a11y.labels.calm"))} />
                <ToggleBtn icon={BookOpen} label={t("a11y.labels.dyslexia")} active={store.dyslexiaMode} onClick={() => handleToggle("dyslexiaMode", t("a11y.labels.dyslexia"))} />
                <ToggleBtn icon={PauseCircle} label={t("a11y.labels.pauseAnimations")} active={store.pauseAnimations} onClick={() => handleToggle("pauseAnimations", t("a11y.labels.pauseAnimations"))} />
              </Section>

              <Section title={t("a11y.sections.libras")} icon={HandMetal}>
                <ToggleBtn icon={HandMetal} label={t("a11y.labels.libras")} active={store.librasEnabled} onClick={() => handleToggle("librasEnabled", t("a11y.labels.libras"))} />
                <p className="px-3 pb-2 text-[11px] leading-relaxed text-ecopet-gray">{t("a11y.librasNote")}</p>
              </Section>

              <Section title={t("a11y.sections.braille")} icon={BookOpen}>
                <ToggleBtn icon={Accessibility} label={t("a11y.labels.screenReader")} active={store.screenReaderMode} onClick={() => handleToggle("screenReaderMode", t("a11y.labels.screenReader"))} />
                <ToggleBtn icon={ScanEye} label={t("a11y.labels.readingMask")} active={store.readingMask} onClick={() => handleToggle("readingMask", t("a11y.labels.readingMask"))} />
                <ToggleBtn icon={Ruler} label={t("a11y.labels.readingGuide")} active={store.readingGuide} onClick={() => handleToggle("readingGuide", t("a11y.labels.readingGuide"))} />
              </Section>

              <Section title={t("a11y.sections.languages")} icon={Languages} defaultOpen>
                <div className="px-2 pb-2">
                  <LanguageSelector />
                </div>
              </Section>

              <Section title={t("a11y.sections.preferences")} icon={Settings2}>
                <ToolBtn
                  icon={RotateCcw}
                  label={t("a11y.reset")}
                  onClick={() => {
                    reset();
                    announce(t("a11y.preferencesSaved"), "polite");
                  }}
                  disabled={!hasActiveSettings()}
                  variant="reset"
                />
                <p className="px-3 py-1 text-[10px] text-ecopet-gray">
                  Fonte {Math.round(fontScale * 100)}%
                </p>
              </Section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => {
          if (minimized) {
            setMinimized(false);
            setOpen(true);
          } else {
            setOpen((v) => !v);
          }
        }}
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all hover:scale-105",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ecopet-yellow focus-visible:ring-offset-2",
          open ? "bg-ecopet-yellow text-ecopet-dark" : "bg-ecopet-green text-white hover:bg-ecopet-dark"
        )}
        aria-expanded={open}
        aria-controls="ecopet-a11y-toolbar"
        aria-label={open ? t("a11y.close") : t("a11y.open")}
        title={open ? t("a11y.close") : t("a11y.open")}
      >
        <Accessibility className="h-6 w-6" aria-hidden />
      </button>
    </div>
  );
}

export const AccessibilityBar = AccessibilityToolbar;

function Section({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultOpen);
  return (
    <div className="mb-1 rounded-xl border border-ecopet-gray/10 dark:border-white/10">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm font-semibold text-ecopet-dark hover:bg-ecopet-green/5 dark:text-white"
        aria-expanded={expanded}
      >
        <span className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-ecopet-green" aria-hidden />
          {title}
        </span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")} aria-hidden />
      </button>
      {expanded && <div className="space-y-0.5 pb-2">{children}</div>}
    </div>
  );
}

function ToolBtn({
  icon: Icon,
  label,
  onClick,
  disabled,
  variant = "default",
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "reset";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cn(
        "flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ecopet-green",
        disabled && "cursor-not-allowed opacity-40",
        variant === "reset" ? "text-red-600 hover:bg-red-50" : "hover:bg-ecopet-green/5"
      )}
    >
      <Icon className="h-4 w-4 shrink-0 text-ecopet-green" aria-hidden />
      <span>{label}</span>
    </button>
  );
}

function ToggleBtn({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ecopet-green",
        active ? "bg-ecopet-green/10 font-semibold" : "hover:bg-ecopet-green/5"
      )}
    >
      <span className="flex items-center gap-3">
        <Icon className="h-4 w-4 shrink-0 text-ecopet-green" aria-hidden />
        {label}
      </span>
      <span className={cn("h-5 w-9 shrink-0 rounded-full", active ? "bg-ecopet-green" : "bg-ecopet-gray/30")} aria-hidden>
        <span className={cn("mt-0.5 block h-4 w-4 rounded-full bg-white shadow transition-transform", active ? "translate-x-4" : "translate-x-0.5")} />
      </span>
    </button>
  );
}

function IconBtn({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} className="rounded-lg p-1.5 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-ecopet-yellow">
      <Icon className="h-4 w-4" aria-hidden />
    </button>
  );
}
