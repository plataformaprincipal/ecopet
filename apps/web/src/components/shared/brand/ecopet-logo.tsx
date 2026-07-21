"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { BrandMark, type BrandMarkTone } from "./brand-mark";

/** Mantido para OG/PWA/legacy — favicon SVG é preferido na fundação */
export const ECOPET_LOGO_SRC = "/brand/ecopet-logo.png";
export const ECOPET_FAVICON_SRC = "/brand/ecopet-mark.svg";
export const ECOPET_ICON_192 = "/brand/ecopet-icon-192.svg";
export const ECOPET_ICON_512 = "/brand/ecopet-icon-512.svg";

export const BRAND_COLORS = {
  primary: "#003B16",
  secondary: "#128A3F",
  cream: "#F4F7F4",
  textDark: "#102015",
  textLight: "#FFFFFF",
  white: "#FFFFFF",
  accent: "#C9A227",
} as const;

export type EcoPetLogoVariant = "full" | "icon" | "horizontal" | "vertical" | "dark" | "light";
export type EcoPetLogoSize = "sm" | "md" | "lg" | "xl" | number;

const SIZE_MAP: Record<Exclude<EcoPetLogoSize, number>, number> = {
  sm: 32,
  md: 48,
  lg: 64,
  xl: 96,
};

function resolveSize(size: EcoPetLogoSize = "md"): number {
  return typeof size === "number" ? size : SIZE_MAP[size];
}

function markTone(variant: EcoPetLogoVariant): BrandMarkTone {
  if (variant === "light") return "on-light";
  return "on-dark";
}

export interface EcoPetLogoProps {
  size?: EcoPetLogoSize;
  variant?: EcoPetLogoVariant;
  showText?: boolean;
  className?: string;
  href?: string | null;
  priority?: boolean;
  /** Mobile: ícone · Desktop: horizontal com texto */
  responsive?: boolean;
  animated?: boolean | "pulse" | "glow";
}

function Wordmark({
  variant,
  compact,
}: {
  variant: EcoPetLogoVariant;
  compact?: boolean;
}) {
  /** White pure only on dark/green brand surfaces — never grayish cream */
  const onDarkSurface = variant === "dark" || variant === "full" || variant === "vertical";
  return (
    <div className={cn("flex flex-col leading-none", compact && "hidden sm:flex")}>
      <span
        className={cn(
          "font-display font-bold tracking-tight",
          compact ? "text-lg" : "text-xl lg:text-2xl",
          onDarkSurface ? "text-white" : "text-ecopet-dark dark:text-white"
        )}
      >
        EcoPet
      </span>
      {!compact && variant !== "icon" && (
        <span
          className={cn(
            "mt-0.5 text-[10px] uppercase tracking-widest",
            onDarkSurface ? "text-white/70" : "text-ecopet-gray dark:text-white/60"
          )}
        >
          Ecossistema Pet
        </span>
      )}
    </div>
  );
}

function LogoMark({
  px,
  variant,
  animated,
}: {
  px: number;
  variant: EcoPetLogoVariant;
  animated?: boolean | "pulse" | "glow";
  priority?: boolean;
}) {
  const animClass =
    animated === "pulse"
      ? "animate-ecopet-pulse"
      : animated === "glow" || animated === true
        ? "animate-ecopet-glow"
        : "";

  const onDarkSurface =
    variant === "full" || variant === "icon" || variant === "dark" || variant === "horizontal" || variant === "vertical";

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-2xl",
        onDarkSurface && "bg-ecopet-dark",
        !onDarkSurface && "bg-ecopet-green/10",
        animClass
      )}
      style={{ width: px, height: px }}
      aria-hidden
    >
      <BrandMark size={Math.round(px * 0.92)} tone={markTone(variant)} className="p-[6%]" />
    </div>
  );
}

function LogoContent({
  size = "md",
  variant = "full",
  showText = false,
  className,
  animated,
}: Omit<EcoPetLogoProps, "href" | "responsive" | "priority"> & { priority?: boolean }) {
  const px = resolveSize(size);
  const isHorizontal = variant === "horizontal" || showText;
  const isVertical = variant === "vertical";
  const markVariant = variant === "horizontal" || variant === "vertical" ? "icon" : variant;

  if (isVertical) {
    return (
      <div className={cn("inline-flex flex-col items-center gap-2", className)}>
        <LogoMark px={px} variant="icon" animated={animated} />
        <Wordmark variant="dark" />
      </div>
    );
  }

  const wordVariant: EcoPetLogoVariant =
    variant === "dark" || variant === "full" ? "dark" : variant === "light" ? "light" : "horizontal";

  return (
    <div className={cn("inline-flex items-center gap-3", className)}>
      <LogoMark px={px} variant={markVariant} animated={animated} />
      {isHorizontal && <Wordmark variant={wordVariant} />}
    </div>
  );
}

export function EcoPetLogo({
  size = "md",
  variant = "full",
  showText = false,
  className,
  href = null,
  priority: _priority = false,
  responsive = false,
  animated = false,
}: EcoPetLogoProps) {
  if (responsive) {
    const inner = (
      <>
        <div className="md:hidden">
          <LogoContent size={size} variant="icon" className={className} animated={animated} />
        </div>
        <div className="hidden md:flex">
          <LogoContent
            size={size}
            variant="horizontal"
            showText
            className={className}
            animated={animated}
          />
        </div>
      </>
    );
    return href ? (
      <Link href={href} className="transition-opacity hover:opacity-90" aria-label="EcoPet — Início">
        {inner}
      </Link>
    ) : (
      inner
    );
  }

  const content = (
    <LogoContent
      size={size}
      variant={variant}
      showText={showText}
      className={className}
      animated={animated}
    />
  );

  return href ? (
    <Link href={href} className="transition-opacity hover:opacity-90" aria-label="EcoPet — Início">
      {content}
    </Link>
  ) : (
    content
  );
}

/** Marca d'água para loading e estados vazios */
export function EcopetWatermark({ className }: { className?: string }) {
  return (
    <div className={cn("watermark-ecopet absolute inset-0 flex items-center justify-center opacity-[0.06]", className)}>
      <EcoPetLogo variant="icon" size="xl" animated="pulse" />
    </div>
  );
}
