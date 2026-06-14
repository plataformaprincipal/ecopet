"use client";

import { EcoPetLogo, EcopetWatermark, type EcoPetLogoVariant } from "./ecopet-logo";

export type EcopetSymbolVariant = "light" | "dark" | "accent";

interface EcopetSymbolProps {
  variant?: EcopetSymbolVariant;
  size?: number;
  animated?: boolean | "pulse" | "glow";
  className?: string;
  symbolOnly?: boolean;
}

const variantMap: Record<EcopetSymbolVariant, EcoPetLogoVariant> = {
  light: "light",
  dark: "dark",
  accent: "full",
};

/** Compatibilidade — delega ao logotipo oficial ECOPET */
export function EcopetSymbol({
  variant = "light",
  size = 48,
  animated = false,
  className,
}: EcopetSymbolProps) {
  return (
    <EcoPetLogo
      variant={variantMap[variant]}
      size={size}
      animated={animated}
      className={className}
    />
  );
}

export { EcopetWatermark };
