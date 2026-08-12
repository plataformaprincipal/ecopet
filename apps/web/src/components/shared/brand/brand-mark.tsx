import { cn } from "@/lib/utils";

export type BrandMarkTone = "on-dark" | "on-light" | "mono-light" | "mono-dark";

export interface BrandMarkProps {
  size?: number;
  tone?: BrandMarkTone;
  className?: string;
  title?: string;
}

/**
 * Símbolo EccoPet — “E” minimalista com nodo de conexão (tecnologia + cuidado).
 * Escalável para favicon, PWA e sidebar.
 */
export function BrandMark({
  size = 40,
  tone = "on-dark",
  className,
  title = "EccoPet",
}: BrandMarkProps) {
  const fills =
    tone === "on-dark" || tone === "mono-light"
      ? { primary: "#FFFFFF", accent: "#34D399", soft: "rgba(255,255,255,0.14)" }
      : tone === "mono-dark"
        ? { primary: "#003B16", accent: "#003B16", soft: "rgba(0,59,22,0.12)" }
        : { primary: "#003B16", accent: "#128A3F", soft: "rgba(18,138,63,0.12)" };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <rect width="64" height="64" rx="16" fill={fills.soft} />
      {/* Letter E — geometric wordmark core */}
      <path
        d="M20 18h24v5.5H27.5v5H40v5.5H27.5v6H44V46H20V18Z"
        fill={fills.primary}
      />
      {/* Connection node — tech accent */}
      <circle cx="48" cy="32" r="4" fill={fills.accent} />
      <path
        d="M40 32h4"
        stroke={fills.accent}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Versão vertical: símbolo + wordmark empilhado */
export function BrandLockupVertical({
  className,
  tone = "on-dark",
}: {
  className?: string;
  tone?: BrandMarkTone;
}) {
  const word =
    tone === "on-dark" || tone === "mono-light" ? "text-white" : "text-ecopet-dark dark:text-white";

  return (
    <div className={cn("inline-flex flex-col items-center gap-2", className)}>
      <BrandMark size={56} tone={tone} />
      <span className={cn("font-display text-xl font-bold tracking-tight", word)}>EccoPet</span>
    </div>
  );
}
