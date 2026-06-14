"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const ECOPET_LOGO_SRC = "/brand/ecopet-logo.png";

export const BRAND_COLORS = {
  primary: "#003B16",
  secondary: "#0F5A2A",
  cream: "#F7F4DC",
  textDark: "#102015",
  textLight: "#F7F4DC",
} as const;

export type EcoPetLogoVariant = "full" | "icon" | "horizontal" | "dark" | "light";
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

function Wordmark({ variant, compact }: { variant: EcoPetLogoVariant; compact?: boolean }) {
  const lightText = variant === "dark" || variant === "full";
  return (
    <div className={cn("flex flex-col leading-none", compact && "hidden sm:flex")}>
      <span
        className={cn(
          "font-display font-extrabold tracking-tight",
          compact ? "text-lg" : "text-xl lg:text-2xl",
          lightText ? "text-[#F7F4DC]" : "text-[#102015] dark:text-[#F7F4DC]"
        )}
      >
        ECOPET
      </span>
      {!compact && (
        <span
          className={cn(
            "mt-0.5 text-[10px] uppercase tracking-widest",
            lightText ? "text-[#F7F4DC]/70" : "text-ecopet-gray dark:text-white/60"
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
  priority,
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

  const onLight = variant === "light";
  const bgStyle =
    variant === "full" || variant === "icon" || variant === "dark" || variant === "horizontal"
      ? { backgroundColor: BRAND_COLORS.primary }
      : onLight
        ? { backgroundColor: BRAND_COLORS.primary }
        : undefined;

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-2xl",
        animClass
      )}
      style={{ width: px, height: px, ...bgStyle }}
      aria-hidden
    >
      <Image
        src={ECOPET_LOGO_SRC}
        alt=""
        width={px * 2}
        height={px * 2}
        className="h-full w-full object-contain p-0.5"
        priority={priority}
      />
    </div>
  );
}

function LogoContent({
  size = "md",
  variant = "full",
  showText = false,
  className,
  priority,
  animated,
}: Omit<EcoPetLogoProps, "href" | "responsive">) {
  const px = resolveSize(size);
  const isHorizontal = variant === "horizontal" || showText;
  const markVariant = variant === "horizontal" ? "icon" : variant;

  return (
    <div className={cn("inline-flex items-center gap-3", className)}>
      <LogoMark px={px} variant={markVariant} animated={animated} priority={priority} />
      {isHorizontal && <Wordmark variant={variant} />}
    </div>
  );
}

export function EcoPetLogo({
  size = "md",
  variant = "full",
  showText = false,
  className,
  href = null,
  priority = false,
  responsive = false,
  animated = false,
}: EcoPetLogoProps) {
  if (responsive) {
    const inner = (
      <>
        <div className="md:hidden">
          <LogoContent size={size} variant="icon" className={className} priority={priority} animated={animated} />
        </div>
        <div className="hidden md:flex">
          <LogoContent
            size={size}
            variant="horizontal"
            showText
            className={className}
            priority={priority}
            animated={animated}
          />
        </div>
      </>
    );
    return href ? (
      <Link href={href} className="transition-opacity hover:opacity-90" aria-label="ECOPET — Início">
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
      priority={priority}
      animated={animated}
    />
  );

  return href ? (
    <Link href={href} className="transition-opacity hover:opacity-90" aria-label="ECOPET — Início">
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
