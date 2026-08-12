import { cn } from "@/lib/utils";

export type BrandMarkTone = "on-dark" | "on-light" | "mono-light" | "mono-dark";

export interface BrandMarkProps {
  size?: number;
  tone?: BrandMarkTone;
  className?: string;
  title?: string;
}

/**
 * Símbolo oficial ECOPET — abstração de ecossistema (nodo + folha + conexão).
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
      ? { primary: "#FFFFFF", accent: "#34D399", soft: "rgba(255,255,255,0.22)" }
      : tone === "mono-dark"
        ? { primary: "#003B16", accent: "#003B16", soft: "rgba(0,59,22,0.18)" }
        : { primary: "#003B16", accent: "#128A3F", soft: "rgba(18,138,63,0.16)" };

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
      {/* Outer ecosystem ring */}
      <circle cx="32" cy="32" r="22" stroke={fills.primary} strokeWidth="2.5" opacity="0.9" />
      {/* Circuit nodes */}
      <circle cx="32" cy="14" r="3" fill={fills.accent} />
      <circle cx="48" cy="32" r="3" fill={fills.accent} />
      <circle cx="32" cy="50" r="3" fill={fills.accent} />
      <circle cx="16" cy="32" r="3" fill={fills.accent} />
      {/* Leaf / care petal */}
      <path
        d="M32 22c6.5 2.5 10 7.2 10 12.5 0 5.8-4.5 9.5-10 9.5s-10-3.7-10-9.5C22 29.2 25.5 24.5 32 22Z"
        fill={fills.primary}
        opacity="0.95"
      />
      {/* Center AI node */}
      <circle cx="32" cy="34.5" r="4.5" fill={fills.accent} />
      <path
        d="M32 22v8.5M42 34.5H36.5M32 47V41.5M22 34.5h5.5"
        stroke={fills.primary}
        strokeWidth="1.75"
        strokeLinecap="round"
        opacity="0.85"
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
