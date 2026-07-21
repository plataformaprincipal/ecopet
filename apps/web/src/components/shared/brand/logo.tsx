import { EcoPetLogo, type EcoPetLogoProps } from "./ecopet-logo";

interface LogoProps {
  className?: string;
  href?: string;
  showWordmark?: boolean;
  symbolSize?: number;
  variant?: EcoPetLogoProps["variant"];
  responsive?: boolean;
}

/** Adapter — prefer EcoPetLogo / BrandMark for new usage */
export function Logo({
  className,
  href = "/",
  showWordmark = false,
  symbolSize = 40,
  variant,
  responsive = false,
}: LogoProps) {
  return (
    <EcoPetLogo
      href={href}
      size={symbolSize}
      variant={variant ?? (showWordmark ? "horizontal" : "icon")}
      showText={showWordmark}
      responsive={responsive || (!showWordmark && !variant)}
      className={className}
      priority
    />
  );
}

export { EcoPetLogo, EcopetWatermark } from "./ecopet-logo";
export { BrandMark, BrandLockupVertical } from "./brand-mark";
export { InstitutionalLoader } from "./institutional-loader";
