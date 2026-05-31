import Link from "next/link";
import { cn } from "@/lib/utils";
import { EcopetSymbol } from "./ecopet-symbol";

interface LogoProps {
  className?: string;
  href?: string;
  showWordmark?: boolean;
  symbolSize?: number;
}

export function Logo({ className, href = "/", showWordmark = false, symbolSize = 40 }: LogoProps) {
  const content = (
    <div className={cn("flex items-center gap-3", className)}>
      <EcopetSymbol variant="light" size={symbolSize} animated="glow" />
      {showWordmark && (
        <div className="flex flex-col leading-none">
          <span className="font-display text-xl font-extrabold tracking-tight text-ecopet-dark dark:text-white">
            ECO<span className="text-ecopet-green">PET</span>
          </span>
          <span className="caption-text uppercase tracking-widest">Ecossistema Pet</span>
        </div>
      )}
    </div>
  );

  return href ? (
    <Link href={href} className="transition-opacity hover:opacity-90" aria-label="ECOPET — Início">
      {content}
    </Link>
  ) : content;
}
