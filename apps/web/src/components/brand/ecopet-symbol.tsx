"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

export type EcopetSymbolVariant = "light" | "dark" | "accent";

interface EcopetSymbolProps {
  variant?: EcopetSymbolVariant;
  size?: number;
  animated?: boolean | "pulse" | "glow";
  className?: string;
  /** Mostra apenas silhuetas — recorta texto ECOPET */
  symbolOnly?: boolean;
}

const variantStyles: Record<EcopetSymbolVariant, string> = {
  light: "bg-ecopet-dark",
  dark: "bg-white",
  accent: "gradient-ecopet-accent",
};

/**
 * Símbolo oficial ECOPET — apenas silhuetas dos animais.
 * Fonte: Manual da Marca ECOPET (cachorro, gato, coelho, ave).
 */
export function EcopetSymbol({
  variant = "light",
  size = 48,
  animated = false,
  className,
  symbolOnly = true,
}: EcopetSymbolProps) {
  const animClass =
    animated === "pulse" ? "animate-ecopet-pulse" :
    animated === "glow" || animated === true ? "animate-ecopet-glow" : "";

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-2xl",
        variantStyles[variant],
        animClass,
        className
      )}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Image
        src="/brand/ecopet-symbol-source.png"
        alt=""
        width={size * 2}
        height={size * 2}
        className={cn(
          "object-cover object-top",
          symbolOnly ? "scale-[1.8] -translate-y-[8%]" : "scale-100"
        )}
        style={{ width: size, height: symbolOnly ? size * 1.6 : size }}
        priority
      />
    </div>
  );
}

/** Watermark discreto para estados vazios e loading */
export function EcopetWatermark({ className }: { className?: string }) {
  return (
    <div className={cn("watermark-ecopet absolute inset-0 flex items-center justify-center", className)}>
      <EcopetSymbol variant="light" size={120} symbolOnly />
    </div>
  );
}
